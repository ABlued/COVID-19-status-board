// 라이브러리 로딩
import axios, { AxiosResponse } from 'axios';
// axios는 타입스크립트 개발자를 위해 index.d.ts를 통해 라이브러리가 타입스크립트에도 최적화되어있다.
import * as Chart from 'chart.js';
// chart.js 라이브러리는 node_modules/chart.js/dist/chart.js에 타입 설정이 잘 되어있지 않아 그냥 쓰게 되면 오류가 일어난다.
// 그래서 타입 설정 라이브러리인 @types/chart.js를 별도로 설치해야 한다. npm i @types/chart.js
import { CovidSummaryResponse, CountrySummaryResponse } from './covid/index';
// utils
function $(selector: string) {
  return document.querySelector(selector);
}
function getUnixTimestamp(date: Date | string | number): number {
  // new Date는 Date | string | number 속성을 받아야한다.
  return new Date(date).getTime(); //getTime() 는 number 반환한다. 그래서 출력값은 number 타입이다.
}

// DOM
const confirmedTotal = $('.confirmed-total') as HTMLSpanElement;
const deathsTotal = $('.deaths') as HTMLParagraphElement;
// const deathsTotal: HTMLParagraphElement = $('.deaths');  // 이렇게 하면 에러가 난다. 오른쪽 값은 element이고 왼쪽값은 HTMLParagraphElement인데 범위가 큰 쪽이 작은 쪽으로 대입할 수 없다.
// 그 이유는 element에서는 없는 메소드에는 HTMLParagraphElement에는 갖고있고 사용할 수 있어야 하기 때문이다.
const recoveredTotal = $('.recovered') as HTMLParagraphElement;
const lastUpdatedTime = $('.last-updated-time') as HTMLParagraphElement;
const rankList = $('.rank-list');
const deathsList = $('.deaths-list');
const recoveredList = $('.recovered-list');
const deathSpinner = createSpinnerElement('deaths-spinner');
const recoveredSpinner = createSpinnerElement('recovered-spinner');

function createSpinnerElement(id: any) {
  const wrapperDiv = document.createElement('div');
  wrapperDiv.setAttribute('id', id);
  wrapperDiv.setAttribute(
    'class',
    'spinner-wrapper flex justify-center align-center'
  );
  const spinnerDiv = document.createElement('div');
  spinnerDiv.setAttribute('class', 'ripple-spinner');
  spinnerDiv.appendChild(document.createElement('div'));
  spinnerDiv.appendChild(document.createElement('div'));
  wrapperDiv.appendChild(spinnerDiv);
  return wrapperDiv;
}

// state
let isDeathLoading = false;
const isRecoveredLoading = false;

// api
function fetchCovidSummary(): Promise<AxiosResponse<CovidSummaryResponse>> {
  const url = 'https://api.covid19api.com/summary';
  return axios.get(url);
}
fetchCovidSummary().then(res => res.data);
// res.data의 속성이 CovidSummaryResponse 로 나타난다.
enum CovidStatus {
  Comfirmed = 'confirmed',
  Recovered = 'recovered',
  Deaths = 'deaths',
}
// API에 대한 설명 : https://documenter.getpostman.com/view/10808728/SzS8rjbc?version=latest#63fda84a-6b43-4506-9cc7-2172561d5c16
// coutryCode는 AF, US 등을 말한다.
function fetchCountryInfo(
  countryCode: string,
  status: CovidStatus
): Promise<AxiosResponse<CountrySummaryResponse>> {
  // status params: confirmed, recovered, deaths
  const url = `https://api.covid19api.com/country/${countryCode}/status/${status}`;
  return axios.get(url);
}

// methods
function startApp() {
  setupData();
  initEvents();
}

// events
function initEvents() {
  rankList.addEventListener('click', handleListClick);
}

async function handleListClick(event: any) {
  let selectedId;
  if (
    event.target instanceof HTMLParagraphElement ||
    event.target instanceof HTMLSpanElement
  ) {
    selectedId = event.target.parentElement.id;
  }
  if (event.target instanceof HTMLLIElement) {
    selectedId = event.target.id;
  }
  if (isDeathLoading) {
    return;
  }
  clearDeathList();
  clearRecoveredList();
  startLoadingAnimation();
  isDeathLoading = true;
  const { data: deathResponse } = await fetchCountryInfo(
    selectedId,
    CovidStatus.Deaths
  ); // fetchCountryInfo의 입력값이 이제는 CovidStatus enum 타입을 받으니 이렇게 변경해야 한다.
  const { data: recoveredResponse } = await fetchCountryInfo(
    selectedId,
    CovidStatus.Recovered
  );
  const { data: confirmedResponse } = await fetchCountryInfo(
    selectedId,
    CovidStatus.Comfirmed
  );
  endLoadingAnimation();
  setDeathsList(deathResponse);
  setTotalDeathsByCountry(deathResponse);
  setRecoveredList(recoveredResponse);
  setTotalRecoveredByCountry(recoveredResponse);
  setChartData(confirmedResponse);
  isDeathLoading = false;
}

function setDeathsList(data: any) {
  const sorted = data.sort(
    (a: any, b: any) => getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date)
  );
  sorted.forEach((value: any) => {
    // forEach, map 함수 내에 입력인자에 타입설정은 한 가지만 들어있다하더라도 () 소괄호를 쳐주어야 한다. 안그러면 에러가 일어난다.
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item-b flex align-center');
    const span = document.createElement('span');
    span.textContent = value.Cases;
    span.setAttribute('class', 'deaths');
    const p = document.createElement('p');
    p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
    li.appendChild(span);
    li.appendChild(p);
    deathsList.appendChild(li);
  });
}

function clearDeathList() {
  deathsList.innerHTML = null;
}
// Element 타입에는 innerText가 없다.
// why? deathsTotal은 위에 보시면 death라는 class의 css선택자이다. 이것을 index.html에서 찾아보면 p태그를 말한다.
// 이런 DOM 요소들은 Element속성을 갖고 있다.
// 정확히 말하자면 Element | HTMLElement | HTMLParagraphElement 이고
// Element ->  HTMLElement -> HTMLParagraphElement 구조로 상속받았다.
function setTotalDeathsByCountry(data: any) {
  deathsTotal.innerText = data[0].Cases;
}

function setRecoveredList(data: any) {
  const sorted = data.sort(
    (a: any, b: any) => getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date)
  );
  sorted.forEach((value: any) => {
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item-b flex align-center');
    const span = document.createElement('span');
    span.textContent = value.Cases;
    span.setAttribute('class', 'recovered');
    const p = document.createElement('p');
    p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
    li.appendChild(span);
    li.appendChild(p);
    recoveredList.appendChild(li);
  });
}

function clearRecoveredList() {
  recoveredList.innerHTML = null;
}

function setTotalRecoveredByCountry(data: any) {
  recoveredTotal.innerText = data[0].Cases;
}

function startLoadingAnimation() {
  deathsList.appendChild(deathSpinner);
  recoveredList.appendChild(recoveredSpinner);
}

function endLoadingAnimation() {
  deathsList.removeChild(deathSpinner);
  recoveredList.removeChild(recoveredSpinner);
}

async function setupData() {
  const { data } = await fetchCovidSummary();
  setTotalConfirmedNumber(data);
  setTotalDeathsByWorld(data);
  setTotalRecoveredByWorld(data);
  setCountryRanksByConfirmedCases(data);
  setLastUpdatedTimestamp(data);
}

function renderChart(data: any, labels: any) {
  const ctx = $('#lineChart').getContext('2d');
  Chart.defaults.color = '#f5eaea';
  Chart.defaults.font.family = 'Exo 2';
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Confirmed for the last two weeks',
          backgroundColor: '#feb72b',
          borderColor: '#feb72b',
          data,
        },
      ],
    },
    options: {},
  });
}

function setChartData(data: any) {
  const chartData = data.slice(-14).map((value: any) => value.Cases);
  const chartLabel = data
    .slice(-14)
    .map((value: any) =>
      new Date(value.Date).toLocaleDateString().slice(5, -1)
    );
  renderChart(chartData, chartLabel);
}

function setTotalConfirmedNumber(data: any) {
  confirmedTotal.innerText = data.Countries.reduce(
    (total: any, current: any) => (total += current.TotalConfirmed),
    0
  );
}

function setTotalDeathsByWorld(data: any) {
  deathsTotal.innerText = data.Countries.reduce(
    (total: any, current: any) => (total += current.TotalDeaths),
    0
  );
}

function setTotalRecoveredByWorld(data: any) {
  recoveredTotal.innerText = data.Countries.reduce(
    (total: any, current: any) => (total += current.TotalRecovered),
    0
  );
}

function setCountryRanksByConfirmedCases(data: any) {
  const sorted = data.Countries.sort(
    (a: any, b: any) => b.TotalConfirmed - a.TotalConfirmed
  );
  sorted.forEach((value: any) => {
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item flex align-center');
    li.setAttribute('id', value.Slug);
    const span = document.createElement('span');
    span.textContent = value.TotalConfirmed;
    span.setAttribute('class', 'cases');
    const p = document.createElement('p');
    p.setAttribute('class', 'country');
    p.textContent = value.Country;
    li.appendChild(span);
    li.appendChild(p);
    rankList.appendChild(li);
  });
}

function setLastUpdatedTimestamp(data: any) {
  lastUpdatedTime.innerText = new Date(data.Date).toLocaleString();
}

startApp();
