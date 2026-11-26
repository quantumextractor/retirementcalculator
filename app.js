const currentYear = new Date().getFullYear();
const inflationRate = 0.03;
const form = document.querySelector("#pension-form");
const hireAgeInput = document.querySelector("#hire-age");
const currentAgeInput = document.querySelector("#current-age");
const plannedAgeInput = document.querySelector("#planned-age");
const fasInput = document.querySelector("#fas");
const results = document.querySelector("#results");
const retirementStatus = document.querySelector("#retirement-status");
const plannedAgeYearHint = document.querySelector("#planned-age-year-hint");
const earlyReductionNote = document.querySelector("#early-reduction-note");
const deferredNote = document.querySelector("#deferred-note");
const deferredNoteText = document.querySelector("#deferred-note-text");
const estimateTag = document.querySelector("#estimate-tag");
const savingsForm = document.querySelector("#savings-form");
const currentBalanceInput = document.querySelector("#current-457-balance");
const biweeklyContributionInput = document.querySelector("#biweekly-457-contribution");
const returnRateInput = document.getElementById("457-return-rate");
const savingsResults = document.querySelector("#savings-results");
const savingsLimitDetails = document.querySelector("#savings-limit-details");
const savingsLimitWarning = document.querySelector("#savings-limit-warning");
const savingsMaximumContribution = document.querySelector(
  "#savings-maximum-contribution",
);
const retirementForm = document.querySelector("#retirement-form");
const retirementResults = document.querySelector("#retirement-results");
const retirementPlanStatus = document.querySelector("#retirement-plan-status");
const retirementRecommendation = document.querySelector(
  "#retirement-recommendation",
);
const retirementPlanRows = document.querySelector("#retirement-plan-rows");
const retirementBalanceChart = document.querySelector(
  "#retirement-balance-chart",
);
const retirementPlanAgeInput = document.querySelector("#plan-through-age");
const desiredMonthlyIncomeInput = document.querySelector(
  "#desired-monthly-income",
);
const filingStatusInput = document.querySelector("#filing-status");

const contributionLimitYear = 2027;
const firstPaycheckDate = Date.UTC(contributionLimitYear, 0, 8);
const endOfContributionLimitYear = Date.UTC(contributionLimitYear + 1, 0, 1);
const biweeklyInterval = 14 * 24 * 60 * 60 * 1000;
const paychecksPerYear =
  Math.floor(
    (endOfContributionLimitYear - firstPaycheckDate - 1) / biweeklyInterval,
  ) + 1;
const cityMatchPerPaycheck = 209;
const standard457bLimit = 25500;
const age50CatchUpLimit = 8500;
const maxEmployeeContributionPerPaycheck = (annualLimit, paychecks) =>
  Math.floor(
    (annualLimit * 100 -
      cityMatchPerPaycheck * 100 * paychecks) /
      paychecks,
  ) / 100;
// 2026 federal tax brackets are held constant in today's dollars.
const federalTaxTables = {
  single: {
    standardDeduction: 16100,
    brackets: [
      { ceiling: 12400, rate: 0.1 },
      { ceiling: 50400, rate: 0.12 },
      { ceiling: 105700, rate: 0.22 },
      { ceiling: 201775, rate: 0.24 },
      { ceiling: 256225, rate: 0.32 },
      { ceiling: 640600, rate: 0.35 },
      { ceiling: Infinity, rate: 0.37 },
    ],
  },
  joint: {
    standardDeduction: 32200,
    brackets: [
      { ceiling: 24800, rate: 0.1 },
      { ceiling: 100800, rate: 0.12 },
      { ceiling: 211400, rate: 0.22 },
      { ceiling: 403550, rate: 0.24 },
      { ceiling: 512450, rate: 0.32 },
      { ceiling: 768700, rate: 0.35 },
      { ceiling: Infinity, rate: 0.37 },
    ],
  },
};

const earlyRetirementReductions = {
  50: 0.09,
  51: 0.06,
  52: 0.03,
};

function formatCurrency(amount, fractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

function getBenefitMultiplier(serviceYears) {
  const enhancedServiceYears = Math.min(Math.max(serviceYears - 14, 0), 10);
  return serviceYears * 0.02 + enhancedServiceYears * 0.005;
}

function getDirectRetirementType(age, serviceYears) {
  if (age >= 53 && serviceYears >= 5) return "Full";
  if (age >= 50 && age < 53 && serviceYears >= 20) return "Early";
  return null;
}

function getDeferredCollectionAge(serviceYears) {
  if (serviceYears < 5) return null;
  return serviceYears >= 20 ? 50 : 53;
}

function getPensionEstimate(hireAge, currentAge, plannedAge, fas) {
  const plannedYear = currentYear + plannedAge - currentAge;
  const serviceYears = plannedAge - hireAge;
  const directRetirementType = getDirectRetirementType(
    plannedAge,
    serviceYears,
  );
  const deferred = !directRetirementType && serviceYears >= 5;
  const eligible = Boolean(directRetirementType || deferred);
  const collectionAge = deferred
    ? getDeferredCollectionAge(serviceYears)
    : directRetirementType
      ? plannedAge
      : null;
  const collectionYear = deferred
    ? currentYear + collectionAge - currentAge
    : null;
  const inflationYears = deferred ? collectionAge - plannedAge : 0;
  const reductionAge = deferred ? collectionAge : plannedAge;
  const reductionRate =
    (directRetirementType === "Early" || deferred)
      ? earlyRetirementReductions[reductionAge] || 0
      : 0;
  const retirementType = directRetirementType
    || (deferred ? `Deferred to age ${collectionAge}` : "Not eligible");
  const multiplier = getBenefitMultiplier(serviceYears);
  const annualBenefitBeforeInflation =
    fas * multiplier * (1 - reductionRate);
  const annualBenefit = eligible
    ? deferred
      ? annualBenefitBeforeInflation / (1 + inflationRate) ** inflationYears
      : annualBenefitBeforeInflation
    : 0;

  return {
    plannedYear,
    serviceYears,
    directRetirementType,
    deferred,
    eligible,
    collectionAge,
    collectionYear,
    inflationYears,
    reductionAge,
    reductionRate,
    retirementType,
    multiplier,
    annualBenefit,
    monthlyBenefit: annualBenefit / 12,
  };
}

function getFederalIncomeTax(grossIncome, filingStatus) {
  const taxTable = federalTaxTables[filingStatus];
  const taxableIncome = Math.max(0, grossIncome - taxTable.standardDeduction);
  let tax = 0;
  let lowerBound = 0;

  for (const bracket of taxTable.brackets) {
    const incomeInBracket =
      Math.min(taxableIncome, bracket.ceiling) - lowerBound;
    if (incomeInBracket > 0) tax += incomeInBracket * bracket.rate;
    if (taxableIncome <= bracket.ceiling) break;
    lowerBound = bracket.ceiling;
  }

  return tax;
}

function getNetRetirementIncome(pensionIncome, savingsWithdrawal, filingStatus) {
  const grossIncome = pensionIncome + savingsWithdrawal;
  return grossIncome - getFederalIncomeTax(grossIncome, filingStatus);
}

function getRequiredSavingsWithdrawal(
  pensionIncome,
  desiredNetIncome,
  filingStatus,
) {
  if (
    getNetRetirementIncome(pensionIncome, 0, filingStatus) >= desiredNetIncome
  ) {
    return 0;
  }

  let low = 0;
  let high = Math.max(desiredNetIncome * 2, 1000);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (
      getNetRetirementIncome(pensionIncome, high, filingStatus) >=
      desiredNetIncome
    ) {
      break;
    }
    high *= 2;
  }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const midpoint = (low + high) / 2;
    if (
      getNetRetirementIncome(pensionIncome, midpoint, filingStatus) >=
      desiredNetIncome
    ) {
      high = midpoint;
    } else {
      low = midpoint;
    }
  }

  return high;
}

function simulateRetirementIncome(
  startingBalance,
  pensionEstimate,
  desiredNetIncome,
  filingStatus,
  retirementAge,
  planThroughAge,
  realReturn,
) {
  let balance = startingBalance;
  const years = planThroughAge - retirementAge;
  const rows = [];

  for (let year = 0; year < years; year += 1) {
    const age = retirementAge + year;
    const balanceAfterGrowth = balance * (1 + realReturn);
    const pensionIncome =
      pensionEstimate.eligible && age >= pensionEstimate.collectionAge
        ? pensionEstimate.annualBenefit
        : 0;
    const requiredWithdrawal = getRequiredSavingsWithdrawal(
      pensionIncome,
      desiredNetIncome,
      filingStatus,
    );
    const savingsWithdrawal = Math.min(requiredWithdrawal, balanceAfterGrowth);
    const grossIncome = pensionIncome + savingsWithdrawal;
    const estimatedTax = getFederalIncomeTax(grossIncome, filingStatus);
    const netIncome = grossIncome - estimatedTax;
    const shortfall = Math.max(desiredNetIncome - netIncome, 0);
    balance = Math.max(balanceAfterGrowth - savingsWithdrawal, 0);
    rows.push({
      age,
      pensionIncome,
      savingsWithdrawal,
      estimatedTax,
      netIncome,
      balance,
      shortfall,
    });
  }

  return {
    rows,
    enough: rows.every((row) => row.shortfall < 0.5),
  };
}

function getRetirementIncomeScenario({
  currentBalance,
  employeeContribution,
  realReturn,
  yearsToRetirement,
  pensionEstimate,
  desiredNetIncome,
  filingStatus,
  retirementAge,
  planThroughAge,
}) {
  const cityContribution = Math.min(
    employeeContribution,
    cityMatchPerPaycheck,
  );
  const balanceAtRetirement = getProjectedSavingsBalance(
    currentBalance,
    employeeContribution,
    cityContribution,
    realReturn,
    yearsToRetirement,
  );
  const projection = simulateRetirementIncome(
    balanceAtRetirement,
    pensionEstimate,
    desiredNetIncome,
    filingStatus,
    retirementAge,
    planThroughAge,
    realReturn,
  );

  return { balanceAtRetirement, projection };
}

function getProjectedSavingsBalance(
  balance,
  employeeContribution,
  cityContribution,
  realRate,
  years,
) {
  const totalPeriods = years * paychecksPerYear;
  const paycheckRate = (1 + realRate) ** (1 / paychecksPerYear) - 1;
  const growthFactor = (1 + paycheckRate) ** totalPeriods;
  const contributionFactor = paycheckRate === 0
    ? totalPeriods
    : (growthFactor - 1) / paycheckRate;
  return (
    balance * growthFactor +
    (employeeContribution + cityContribution) * contributionFactor
  );
}

function updateSavingsContributionGuidance() {
  const age50CatchUpAvailable =
    currentAgeInput.value && Number(currentAgeInput.value) >= 50;
  const annualLimit = standard457bLimit +
    (age50CatchUpAvailable ? age50CatchUpLimit : 0);
  const maxEmployeeContribution =
    maxEmployeeContributionPerPaycheck(annualLimit, paychecksPerYear);
  const ageDescription = age50CatchUpAvailable ? " age 50+" : "";
  savingsMaximumContribution.textContent =
    formatCurrency(Math.floor(maxEmployeeContribution));
  const employeeContribution = Number(biweeklyContributionInput.value);
  const currentCityMatch = biweeklyContributionInput.value
    ? Math.min(employeeContribution, cityMatchPerPaycheck)
    : null;
  savingsLimitDetails.textContent =
    `${contributionLimitYear} max employee contribution${ageDescription}: ${formatCurrency(maxEmployeeContribution, 2)} per paycheck. The ${formatCurrency(annualLimit)} annual limit includes the City match and is based on ${paychecksPerYear} paychecks.`;

  savingsLimitWarning.hidden = true;
  if (!biweeklyContributionInput.value) {
    return;
  }

  const totalAnnualContribution =
    (employeeContribution + currentCityMatch) * paychecksPerYear;
  if (totalAnnualContribution <= annualLimit) return;

  savingsLimitWarning.textContent =
    `This amount plus the City match exceeds the ${contributionLimitYear} annual limit for ${paychecksPerYear} paychecks.`;
  savingsLimitWarning.hidden = false;
}

function updateSidebar() {
  const hasAgeInputs =
    hireAgeInput.value && currentAgeInput.value && plannedAgeInput.value;
  if (!hasAgeInputs) {
    earlyReductionNote.hidden = true;
    deferredNote.hidden = true;
    return;
  }

  const hireAge = Number(hireAgeInput.value);
  const currentAge = Number(currentAgeInput.value);
  const plannedAge = Number(plannedAgeInput.value);
  const serviceYears = plannedAge - hireAge;
  const validAges = hireAge <= currentAge && plannedAge >= currentAge;
  if (!validAges) {
    earlyReductionNote.hidden = true;
    deferredNote.hidden = true;
    return;
  }

  const retirementType = getDirectRetirementType(plannedAge, serviceYears);
  const deferred = retirementType === null;
  const collectionAge = getDeferredCollectionAge(serviceYears);

  earlyReductionNote.hidden = retirementType !== "Early";
  deferredNote.hidden = !deferred;
  if (!deferred) return;

  if (collectionAge === null) {
    deferredNoteText.textContent =
      "Fewer than 5 service years: no pension estimate is available.";
    return;
  }

  const reductionRate = earlyRetirementReductions[collectionAge] || 0;
  const reductionText = reductionRate
    ? ` A ${reductionRate * 100}% early-retirement reduction applies.`
    : "";
  const inflationYears = collectionAge - plannedAge;
  deferredNoteText.textContent =
    `Not eligible at age ${plannedAge}. Payments start at age ${collectionAge}.${reductionText} Buying power reflects 3% annual inflation for ${inflationYears} year${inflationYears === 1 ? "" : "s"}. The first full year without COLA is not included.`;
}

function updateAgeValidation() {
  const hireAge = Number(hireAgeInput.value);
  const currentAge = Number(currentAgeInput.value);
  const plannedAge = Number(plannedAgeInput.value);

  plannedAgeInput.min = currentAgeInput.value || "1";
  retirementPlanAgeInput.min = plannedAgeInput.value
    ? String(Number(plannedAgeInput.value) + 1)
    : "2";
  hireAgeInput.setCustomValidity(
    hireAgeInput.value && currentAgeInput.value && hireAge > currentAge
      ? "Age when you started cannot be greater than your current age."
      : "",
  );
  if (currentAgeInput.value && plannedAgeInput.value) {
    const plannedYear = currentYear + plannedAge - currentAge;
    plannedAgeYearHint.textContent = `(estimated year: ${plannedYear})`;
  } else {
    plannedAgeYearHint.textContent = "(estimated year: —)";
  }

  updateSidebar();
}

hireAgeInput.addEventListener("input", updateAgeValidation);
currentAgeInput.addEventListener("input", updateAgeValidation);
currentAgeInput.addEventListener("input", updateSavingsContributionGuidance);
plannedAgeInput.addEventListener("input", updateAgeValidation);
biweeklyContributionInput.addEventListener(
  "input",
  updateSavingsContributionGuidance,
);
updateSavingsContributionGuidance();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateAgeValidation();

  if (!form.reportValidity()) return;

  const hireAge = Number(hireAgeInput.value);
  const currentAge = Number(currentAgeInput.value);
  const plannedAge = Number(plannedAgeInput.value);
  const fas = Number(fasInput.value);
  const pensionEstimate = getPensionEstimate(
    hireAge,
    currentAge,
    plannedAge,
    fas,
  );
  const {
    plannedYear,
    serviceYears,
    directRetirementType,
    deferred,
    eligible,
    collectionAge,
    collectionYear,
    inflationYears,
    reductionAge,
    reductionRate,
    retirementType,
    multiplier,
    annualBenefit,
    monthlyBenefit,
  } = pensionEstimate;

  let statusClass = "is-ineligible";
  let statusTitle;
  let statusDescription;
  if (directRetirementType === "Full") {
    statusClass = "is-full";
    statusTitle = "Full retirement eligible";
    statusDescription =
      "Age 53 or older with at least 5 years of service. The estimate assumes payments start when you leave service.";
  } else if (directRetirementType === "Early") {
    statusClass = "is-early";
    statusTitle = "Early retirement eligible";
    statusDescription =
      `Age 50–52 with at least 20 years of service. Your benefit is reduced by ${(reductionRate * 100).toFixed(0)}%.`;
  } else if (deferred) {
    statusClass = reductionRate ? "is-early" : "is-deferred";
    statusTitle = `Not yet eligible at age ${plannedAge}`;
    statusDescription = inflationYears
      ? `With ${serviceYears} years of service, the estimate defers payments until age ${collectionAge}. Purchasing power is adjusted for 3% annual inflation over ${inflationYears} year${inflationYears === 1 ? "" : "s"} before collection.`
      : `With ${serviceYears} years of service, the estimate assumes payments begin at age ${collectionAge}.`;
  } else {
    statusTitle = "Not eligible";
    statusDescription =
      "At least 5 years of service are required for a pension estimate.";
  }

  retirementStatus.className = `retirement-status ${statusClass}`;
  const statusHeading = document.createElement("strong");
  const statusText = document.createElement("span");
  statusHeading.textContent = statusTitle;
  statusText.textContent = statusDescription;
  retirementStatus.replaceChildren(statusHeading, statusText);

  document.querySelector("#result-title").textContent = deferred
    ? "Monthly purchasing power at collection"
    : eligible
      ? "Your estimated monthly pension"
      : "Pension estimate unavailable";
  document.querySelector("#pension-output").hidden = !eligible;
  estimateTag.hidden = !eligible;
  document.querySelector("#monthly-benefit").textContent =
    eligible ? formatCurrency(monthlyBenefit) : "—";
  document.querySelector("#annual-benefit").textContent = deferred
    ? `${formatCurrency(annualBenefit)} per year in today’s purchasing power at age ${collectionAge}`
    : eligible
      ? `${formatCurrency(annualBenefit)} estimated per year`
      : "At least 5 years of service are required.";
  document.querySelector("#eligibility-type").textContent = retirementType;
  document.querySelector("#service-years-label").textContent = deferred
    ? "Estimated service at separation"
    : "Estimated service at retirement";
  document.querySelector("#service-years").textContent =
    `${serviceYears} years`;
  document.querySelector("#separation-details").hidden = !deferred;
  document.querySelector("#separation-details-value").textContent = deferred
    ? `Age ${plannedAge} (${plannedYear})`
    : "";
  document.querySelector("#pension-start-details").hidden =
    !deferred || !eligible;
  document.querySelector("#pension-start-value").textContent = deferred
    ? `Age ${collectionAge} (${collectionYear})`
    : "";
  document.querySelector("#inflation-details").hidden =
    !deferred || !eligible;
  document.querySelector("#inflation-details-value").textContent = deferred
    ? `3% annually for ${inflationYears} year${inflationYears === 1 ? "" : "s"}`
    : "";
  document.querySelector("#benefit-multiplier").textContent =
    `${(multiplier * 100).toFixed(1)}%`;
  document.querySelector("#early-reduction").textContent = reductionRate
    ? `${(reductionRate * 100).toFixed(0)}% at age ${reductionAge}`
    : "None";
  document.querySelector("#result-fas").textContent = formatCurrency(fas);

  plannedAgeYearHint.textContent = `(estimated year: ${plannedYear})`;
  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

savingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateAgeValidation();

  if (!savingsForm.reportValidity()) return;
  if (!currentAgeInput.reportValidity() || !plannedAgeInput.reportValidity()) {
    return;
  }

  const years = Number(plannedAgeInput.value) - Number(currentAgeInput.value);
  const balance = Number(currentBalanceInput.value);
  const employeeContribution = Number(biweeklyContributionInput.value);
  const cityContribution = Math.min(
    employeeContribution,
    cityMatchPerPaycheck,
  );
  const nominalReturn = Number(returnRateInput.value) / 100;
  const realReturn = nominalReturn - inflationRate;
  const projectedBalance = getProjectedSavingsBalance(
    balance,
    employeeContribution,
    cityContribution,
    realReturn,
    years,
  );
  const annualContribution =
    (employeeContribution + cityContribution) * paychecksPerYear;

  document.querySelector("#savings-result-title").textContent =
    `Projected balance at age ${plannedAgeInput.value}`;
  document.querySelector("#savings-amount").textContent =
    formatCurrency(projectedBalance);
  document.querySelector("#savings-amount-caption").textContent =
    "In today’s purchasing power";
  document.querySelector("#savings-years").textContent =
    `${years} year${years === 1 ? "" : "s"}`;
  document.querySelector("#savings-return").textContent =
    `${(nominalReturn * 100).toFixed(1)}%`;
  document.querySelector("#savings-real-return").textContent =
    `${(realReturn * 100).toFixed(1)}%`;
  document.querySelector("#savings-employee-contribution").textContent =
    `${formatCurrency(employeeContribution, 2)} per paycheck`;
  document.querySelector("#savings-city-match").textContent =
    `${formatCurrency(cityContribution, 2)} per paycheck`;
  document.querySelector("#savings-total-contribution").textContent =
    `${formatCurrency(annualContribution, 2)} per year (${paychecksPerYear} checks)`;

  savingsResults.hidden = false;
  savingsResults.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

function renderRetirementProjection(rows) {
  const maxGrossIncome = Math.max(
    1,
    ...rows.map((row) => row.pensionIncome + row.savingsWithdrawal),
  );
  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    const tableRow = document.createElement("tr");
    const ageCell = document.createElement("th");
    ageCell.scope = "row";
    ageCell.textContent = row.age;
    tableRow.append(ageCell);

    const incomeCell = document.createElement("td");
    incomeCell.className = "income-cell";
    const incomeStack = document.createElement("div");
    incomeStack.className = "income-stack";
    incomeStack.setAttribute("aria-hidden", "true");
    const pensionBar = document.createElement("span");
    pensionBar.className = "income-bar-pension";
    pensionBar.style.width =
      `${(row.pensionIncome / maxGrossIncome) * 100}%`;
    const savingsBar = document.createElement("span");
    savingsBar.className = "income-bar-savings";
    savingsBar.style.width =
      `${(row.savingsWithdrawal / maxGrossIncome) * 100}%`;
    incomeStack.append(pensionBar, savingsBar);
    const incomeAmounts = document.createElement("div");
    incomeAmounts.className = "income-amounts";
    incomeAmounts.textContent =
      `Pension ${formatCurrency(row.pensionIncome)} / 457(b) ${formatCurrency(row.savingsWithdrawal)}`;
    incomeCell.append(incomeStack, incomeAmounts);
    tableRow.append(incomeCell);

    [
      row.estimatedTax,
      row.netIncome,
      row.balance,
      row.shortfall,
    ].forEach((amount, index) => {
      const cell = document.createElement("td");
      cell.textContent = index === 3 && amount < 0.5
        ? "—"
        : formatCurrency(amount);
      if (index === 3 && amount >= 0.5) {
        cell.className = "projection-shortfall";
      }
      tableRow.append(cell);
    });

    fragment.append(tableRow);
  });

  retirementPlanRows.replaceChildren(fragment);
}

function renderBalanceChart(rows) {
  const namespace = "http://www.w3.org/2000/svg";
  const createSvgElement = (name, attributes, text = "") => {
    const element = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([attribute, value]) => {
      element.setAttribute(attribute, value);
    });
    element.textContent = text;
    return element;
  };
  const plot = { left: 58, right: 704, top: 14, bottom: 164 };
  const maxBalance = Math.max(1000, ...rows.map((row) => row.balance));
  const x = (index) =>
    plot.left +
    (index / Math.max(rows.length - 1, 1)) * (plot.right - plot.left);
  const y = (balance) =>
    plot.top +
    ((maxBalance - balance) / maxBalance) * (plot.bottom - plot.top);

  retirementBalanceChart.replaceChildren();
  retirementBalanceChart.setAttribute(
    "aria-describedby",
    "balance-chart-description",
  );
  retirementBalanceChart.setAttribute(
    "aria-label",
    `Projected 457(b) balance from age ${rows[0].age} to ${rows[rows.length - 1].age}.`,
  );
  retirementBalanceChart.append(
    createSvgElement(
      "desc",
      { id: "balance-chart-description" },
      `Balance is shown in today's dollars and ends at ${formatCurrency(rows[rows.length - 1].balance)}.`,
    ),
  );

  [0, 0.5, 1].forEach((fraction) => {
    const balance = maxBalance * fraction;
    const lineY = y(balance);
    retirementBalanceChart.append(
      createSvgElement("line", {
        x1: plot.left,
        y1: lineY,
        x2: plot.right,
        y2: lineY,
        class: "balance-chart-grid",
      }),
      createSvgElement(
        "text",
        {
          x: plot.left - 9,
          y: lineY + 3,
          class: "balance-chart-label",
          "text-anchor": "end",
        },
        formatCompactCurrency(balance),
      ),
    );
  });

  const points = rows
    .map((row, index) => `${x(index)},${y(row.balance)}`)
    .join(" ");
  retirementBalanceChart.append(
    createSvgElement("polyline", {
      points,
      class: "balance-chart-line",
    }),
    createSvgElement(
      "text",
      {
        x: plot.left,
        y: plot.bottom + 25,
        class: "balance-chart-label",
        "text-anchor": "start",
      },
      `Age ${rows[0].age}`,
    ),
    createSvgElement(
      "text",
      {
        x: plot.right,
        y: plot.bottom + 25,
        class: "balance-chart-label",
        "text-anchor": "end",
      },
      `Age ${rows[rows.length - 1].age}`,
    ),
  );
}

function formatCompactCurrency(amount) {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return formatCurrency(amount);
}

function updateRetirementRecommendation({
  currentScenario,
  createScenario,
  employeeContribution,
  maxEmployeeContribution,
  annualLimit,
  planThroughAge,
}) {
  const currentTotalAnnualContribution =
    (employeeContribution +
      Math.min(employeeContribution, cityMatchPerPaycheck)) *
    paychecksPerYear;
  const exceedsLimit = currentTotalAnnualContribution > annualLimit;
  retirementPlanStatus.className = "retirement-plan-status";

  if (currentScenario.projection.enough) {
    retirementPlanStatus.classList.add("is-funded");
    retirementPlanStatus.textContent =
      `Projected income meets your goal through age ${planThroughAge - 1}; the ending balance is at age ${planThroughAge}.`;
    retirementRecommendation.textContent = exceedsLimit
      ? `This projection uses a contribution above the ${contributionLimitYear} limit. The current input plus the City match totals ${formatCurrency(currentTotalAnnualContribution)} per year; the limit is ${formatCurrency(annualLimit)}.`
      : "Based on these assumptions, the projected pension and 457(b) withdrawals cover your income goal.";
    return;
  }

  retirementPlanStatus.classList.add("is-shortfall");
  retirementPlanStatus.textContent =
    `The projection shows years when income falls below your goal before age ${planThroughAge}.`;

  const maxContributionScenario = createScenario(maxEmployeeContribution);
  if (!maxContributionScenario.projection.enough) {
    retirementRecommendation.textContent =
      `The goal is not fully covered even at the 2027 maximum employee contribution of ${formatCurrency(maxEmployeeContribution, 2)} per paycheck, including the City match.`;
    return;
  }

  let low = Math.min(employeeContribution, maxEmployeeContribution);
  let high = maxEmployeeContribution;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const midpoint = (low + high) / 2;
    if (createScenario(midpoint).projection.enough) {
      high = midpoint;
    } else {
      low = midpoint;
    }
  }

  const recommendedContribution = Math.min(
    maxEmployeeContribution,
    Math.ceil(high * 100) / 100,
  );
  const increase = Math.max(0, recommendedContribution - employeeContribution);
  retirementRecommendation.textContent =
    `Estimated employee contribution to meet the goal: about ${formatCurrency(recommendedContribution, 2)} per paycheck, or ${formatCurrency(increase, 2)} more than entered. This is only an estimate and remains within the 2027 limit.`;
}

retirementForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateAgeValidation();

  const pensionFormIsValid = form.reportValidity();
  const savingsFormIsValid = savingsForm.reportValidity();
  const retirementFormIsValid = retirementForm.reportValidity();
  if (!pensionFormIsValid || !savingsFormIsValid || !retirementFormIsValid) {
    return;
  }

  const hireAge = Number(hireAgeInput.value);
  const currentAge = Number(currentAgeInput.value);
  const plannedAge = Number(plannedAgeInput.value);
  const fas = Number(fasInput.value);
  const planThroughAge = Number(retirementPlanAgeInput.value);
  const desiredNetIncome = Number(desiredMonthlyIncomeInput.value) * 12;
  const employeeContribution = Number(biweeklyContributionInput.value);
  const currentBalance = Number(currentBalanceInput.value);
  const realReturn = Number(returnRateInput.value) / 100 - inflationRate;
  const yearsToRetirement = plannedAge - currentAge;
  const pensionEstimate = getPensionEstimate(
    hireAge,
    currentAge,
    plannedAge,
    fas,
  );
  const age50CatchUpAvailable = currentAge >= 50;
  const annualLimit =
    standard457bLimit + (age50CatchUpAvailable ? age50CatchUpLimit : 0);
  const maxEmployeeContribution = maxEmployeeContributionPerPaycheck(
    annualLimit,
    paychecksPerYear,
  );
  const createScenario = (contribution) =>
    getRetirementIncomeScenario({
      currentBalance,
      employeeContribution: contribution,
      realReturn,
      yearsToRetirement,
      pensionEstimate,
      desiredNetIncome,
      filingStatus: filingStatusInput.value,
      retirementAge: plannedAge,
      planThroughAge,
    });
  const currentScenario = createScenario(employeeContribution);

  document.querySelector("#retirement-income-goal").textContent =
    `${formatCurrency(desiredNetIncome / 12)} per month`;
  document.querySelector("#retirement-balance-at-retirement").textContent =
    formatCurrency(currentScenario.balanceAtRetirement);
  document.querySelector("#retirement-planning-period").textContent =
    `Ages ${plannedAge}–${planThroughAge - 1}; balance at ${planThroughAge} (${planThroughAge - plannedAge} years)`;
  renderRetirementProjection(currentScenario.projection.rows);
  renderBalanceChart(currentScenario.projection.rows);
  updateRetirementRecommendation({
    currentScenario,
    createScenario,
    employeeContribution,
    maxEmployeeContribution,
    annualLimit,
    planThroughAge,
  });

  retirementResults.hidden = false;
  retirementResults.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
