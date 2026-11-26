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
  const plannedYear = currentYear + plannedAge - currentAge;
  const serviceYears = plannedAge - hireAge;
  const directRetirementType = getDirectRetirementType(plannedAge, serviceYears);
  const deferred = !directRetirementType && serviceYears >= 5;
  const eligible = Boolean(directRetirementType || deferred);
  const collectionAge = deferred
    ? getDeferredCollectionAge(serviceYears)
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
  const annualBenefit = deferred
    ? annualBenefitBeforeInflation / (1 + inflationRate) ** inflationYears
    : annualBenefitBeforeInflation;
  const monthlyBenefit = annualBenefit / 12;

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
