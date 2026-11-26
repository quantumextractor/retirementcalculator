# retirementcalculator
A retirement calculator for LEOFF 2 members.
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