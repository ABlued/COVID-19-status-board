// 라이브러리 로딩
import axios, { AxiosResponse } from 'axios';
// axios는 타입스크립트 개발자를 위해 index.d.ts를 통해 라이브러리가 타입스크립트에도 최적화되어있다.
import Chart from 'chart.js';
// chart.js 라이브러리는 node_modules/chart.js/dist/chart.js에 타입 설정이 잘 되어있지 않아 그냥 쓰게 되면 오류가 일어난다.
// 그래서 타입 설정 라이브러리인 @types/chart.js를 별도로 설치해야 한다. npm i @types/chart.js
import {
  CovidSummaryResponse,
  CountrySummaryResponse,
  Country,
  CoutrySummaryInfo,
} from './covid/index';
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
const rankList = $('.rank-list') as HTMLOListElement;
const deathsList = $('.deaths-list') as HTMLOListElement; // 기본적으로 querySelector를 이용하면 반환객체가 Element나 null타입으로 추론된다. 이때 null타입처리를 해야한다.
const recoveredList = $('.recovered-list') as HTMLOListElement;
const deathSpinner = createSpinnerElement('deaths-spinner');
const recoveredSpinner = createSpinnerElement('recovered-spinner');

function createSpinnerElement(id: string) {
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
  countryName: string | undefined, // 그래서 여기에다 undefined를 추가한다.
  status: CovidStatus
): Promise<AxiosResponse<CountrySummaryResponse>> {
  // status params: confirmed, recovered, deaths
  const url = `https://api.covid19api.com/country/${countryName}/status/${status}`; // 그러면 이 url에 undefined가 들어갈 수 있으니 이 점 주의해야한다.
  return axios.get(url);
}

// methods
function startApp() {
  setupData();
  initEvents();
}

// events
function initEvents() {
  // null 을 받을 수 있으니 null 처리를 해야한다.
  if (!rankList) {
    return;
  }
  rankList.addEventListener('click', handleListClick);
}

async function handleListClick(event: Event) {
  let selectedId;
  if (
    event.target instanceof HTMLParagraphElement ||
    event.target instanceof HTMLSpanElement
  ) {
    selectedId = event.target.parentElement // null 처리
      ? event.target.parentElement.id
      : undefined;
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
    selectedId, // 앞에서 string || undefined 형식으로 받을 수 있다고 처리했지만 fetchCountryInfo함수에서는 string만 받는다라고 했으니 오류가 일어난다.
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

function setDeathsList(data: CountrySummaryResponse) {
  const sorted = data.sort(
    (a: CoutrySummaryInfo, b: CoutrySummaryInfo) =>
      getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date)
  );
  sorted.forEach((value: CoutrySummaryInfo) => {
    // forEach, map 함수 내에 입력인자에 타입설정은 한 가지만 들어있다하더라도 () 소괄호를 쳐주어야 한다. 안그러면 에러가 일어난다.
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item-b flex align-center');
    const span = document.createElement('span');
    span.textContent = value.Cases.toString();
    span.setAttribute('class', 'deaths');
    const p = document.createElement('p');
    p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
    li.appendChild(span);
    li.appendChild(p);

    deathsList!.appendChild(li); // !는 type assertion으로 null이 아니면 ! 뒤에 오는 것을 실행하는 지정자이다.
    // 그렇지만 !나 as같은 type assertion을 남발하면 안된다. null이 아닌 빈 객체 {} 가 들어와도 오류를 띄지 않기 때문이다.
  });
}

function clearDeathList() {
  if (!deathsList) {
    return;
  }
  deathsList.innerHTML = '';
}
// Element 타입에는 innerText가 없다.
// why? deathsTotal은 위에 보시면 death라는 class의 css선택자이다. 이것을 index.html에서 찾아보면 p태그를 말한다.
// 이런 DOM 요소들은 Element속성을 갖고 있다.
// 정확히 말하자면 Element | HTMLElement | HTMLParagraphElement 이고
// Element ->  HTMLElement -> HTMLParagraphElement 구조로 상속받았다.
function setTotalDeathsByCountry(data: CountrySummaryResponse) {
  deathsTotal.innerText = data[0].Cases.toString();
}

function setRecoveredList(data: CountrySummaryResponse) {
  const sorted = data.sort(
    (a: CoutrySummaryInfo, b: CoutrySummaryInfo) =>
      getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date)
  );
  sorted.forEach((value: CoutrySummaryInfo) => {
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item-b flex align-center');
    const span = document.createElement('span');
    span.textContent = value.Cases.toString();
    span.setAttribute('class', 'recovered');
    const p = document.createElement('p');
    p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
    li.appendChild(span);
    li.appendChild(p);
    recoveredList?.appendChild(li); // ?는 옵셔널 체이닝 오퍼레이터(optional chaining operator)이다.
    // if(recoveredList === null || recoveredList === undefined){
    //   return;
    // } else {
    //   recoveredList.appendChild(li);
    // }
    // 옵셔널 체이닝은 이 코드와 유사하다.
  });
}

function clearRecoveredList() {
  recoveredList.innerHTML = '';
}

function setTotalRecoveredByCountry(data: CountrySummaryResponse) {
  recoveredTotal.innerText = data[0].Cases.toString();
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

function renderChart(data: number[], labels: string[]) {
  const ctx = ($('#lineChart') as HTMLCanvasElement).getContext('2d');
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

function setChartData(data: CountrySummaryResponse) {
  const chartData = data
    .slice(-14)
    .map((value: CoutrySummaryInfo) => value.Cases);
  const chartLabel = data
    .slice(-14)
    .map((value: CoutrySummaryInfo) =>
      new Date(value.Date).toLocaleDateString().slice(5, -1)
    );
  renderChart(chartData, chartLabel);
}

function setTotalConfirmedNumber(data: CovidSummaryResponse) {
  confirmedTotal.innerText = data.Countries.reduce(
    (total: number, current: Country) => (total += current.TotalConfirmed),
    0
  ).toString();
}

function setTotalDeathsByWorld(data: CovidSummaryResponse) {
  deathsTotal.innerText = data.Countries.reduce(
    (total: number, current: Country) => (total += current.TotalDeaths),
    0
  ).toString();
}

function setTotalRecoveredByWorld(data: CovidSummaryResponse) {
  recoveredTotal.innerText = data.Countries.reduce(
    (total: number, current: Country) => (total += current.TotalRecovered),
    0
  ).toString();
}

function setCountryRanksByConfirmedCases(data: CovidSummaryResponse) {
  const sorted = data.Countries.sort(
    (a: Country, b: Country) => b.TotalConfirmed - a.TotalConfirmed
  );
  sorted.forEach((value: Country) => {
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item flex align-center');
    li.setAttribute('id', value.Slug);
    const span = document.createElement('span');
    span.textContent = value.TotalConfirmed.toString();
    span.setAttribute('class', 'cases');
    const p = document.createElement('p');
    p.setAttribute('class', 'country');
    p.textContent = value.Country;
    li.appendChild(span);
    li.appendChild(p);
    rankList.appendChild(li);
  });
}

function setLastUpdatedTimestamp(data: CovidSummaryResponse) {
  lastUpdatedTime.innerText = new Date(data.Date).toLocaleString();
}

startApp();
