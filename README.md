# Spokane Firefighters Retirement Planner
A retirement planning tool for Spokane Firefighters with LEOFF 2 pension and 457(b) savings estimates.
I will have inputs for people to estimate their pension benefit and forecast their 457b plan as well as their financial needs for retirement.
The goal is to have the app tell users how much more they may to save to meet their retirement goals.

## Run the app

Open `index.html` in a browser. The app is a standalone HTML, CSS, and JavaScript page; no install or build step is required.

## Pension estimate

Enter age at hire, current age, planned age to leave service, and estimated annual final average salary (FAS). The app automatically chooses when payments begin based on the entered age and estimated service:

- Full retirement is estimated for age 53 or older with at least 5 service years. Early retirement is estimated for ages 50–52 with at least 20 service years. In either case, payments are assumed to start when the member leaves service.
- If not eligible at the age entered but with at least 5 service years, the estimate assumes the member leaves service and collects later: age 50 for 20+ service years, or age 53 for 5–19 service years.
- With fewer than 5 service years, no pension estimate is shown.

Estimated service is the planned age to leave service minus age at hire. The estimated calendar year is the current year plus the difference between planned age and current age.

The initial multiplier applies 2% to each service year, with an additional 0.5% for each service year from 15 through 24. Years 25 and onward use 2% per year. The estimated annual pension is FAS multiplied by this rate and adjusted by any early-retirement reduction; the monthly estimate is the annual amount divided by 12.

Early retirement has a 9% reduction at age 50, 6% at age 51, and 3% at age 52. These reductions apply both to direct early retirement and deferred collection at the corresponding ages.

For deferred benefits, the app estimates purchasing power at collection by applying a fixed 3% annual inflation assumption to the period from separation to collection. This does not include the first full year without a COLA or project COLAs after collection. FAS is used in today's dollars, and future salary growth is not projected. This is a preliminary planning estimate, not an official LEOFF 2 benefit quote; it uses whole-year ages and does not yet account for additional plan rules or adjustments.

## 457(b) balance projection

Enter the current account balance, your contribution per paycheck, and expected annual return. The projection period is the number of years from current age to planned age to leave service. The City matches employee contributions dollar-for-dollar up to $209 per paycheck, and the app reports the projected balance in today's purchasing power.

The projection assumes 26 biweekly paychecks each year, contributions deposited at the end of each pay period, and employee and City contributions that rise with inflation to keep their purchasing power constant. The estimate excludes fees, taxes, and withdrawals; returns are not guaranteed.

For 2027, the app uses the department-provided $25,500 annual contribution limit and adds an $8,500 catch-up limit for users whose current age is 50 or older. It includes the City's $209 contribution in the total. The first paycheck is January 8, 2027, resulting in 26 biweekly paychecks that year. The maximum employee contribution is $771.76 per paycheck under the standard limit or $1,098.69 at age 50 or older. Review the limit, match, and first paycheck date with HR when updating the calculator for a new year.

## Retirement income plan

Enter an after-tax monthly income goal, choose a federal filing status, and select the age through which to plan. The projection starts at the planned age to leave service and covers each age up to, but not including, the selected end age. It shows estimated LEOFF 2 pension income, Traditional 457(b) withdrawals, federal income tax, after-tax income, any income gap, and the remaining account balance.

The planner estimates the gross 457(b) withdrawal needed to meet the after-tax income goal after accounting for pension income and federal income tax. It grows the projected 457(b) balance by the entered return less 3% inflation, then calculates that year's withdrawal. Pension payments are treated as taxable income and are assumed to keep pace with inflation once collection begins. Deferred pension amounts use the existing pension estimate, including its inflation adjustment before collection.

The tax estimate uses 2026 federal tax brackets and the standard deduction in today's dollars, based on the [IRS 2026 tax inflation adjustments](https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill). It excludes state and local taxes, spouse or other household income, Social Security, credits, and special deductions. Married filing jointly uses the joint brackets and standard deduction but does not include any spouse income. Roth 457(b) balances and withdrawals are not modeled.

If the goal is not met, the planner estimates an employee contribution per paycheck that may cover it, subject to the configured 2027 employee contribution maximum and City match. If the goal remains unmet at that maximum, it reports that instead. These are simplified planning estimates, not tax, investment, or retirement advice; future returns, tax rules, pension adjustments, and actual benefits may differ.