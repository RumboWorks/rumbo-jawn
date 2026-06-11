
- slider should have annual first, then monthly, with annual the default.
- add a sliding background element like we have in .slu-wb__ctrl-section
- on annual, show the monthly amount first, large (same size as monthly $), then the annual amount below it, smaller.
- other than free, if a tier has 0's for its prices, don't show it on the pricing page.
- add a subtle rollover color on the entire tile, and make the entire tile clickable

in .rj-pricing-card__features the checkmarks and text aren't on the same line.  Something like this is needed
````
ul.rj-pricing-card__features li {
    display: flex;
    gap: .25em;
    align-items: center;
}
````
