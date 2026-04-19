# Rollz User Guide

This guide explains how to use Rollz day to day, from simple rolls to advanced formulas.

![Rollz overview](images/guide-accueil.png)

## 1. What Rollz Does

Rollz is a dice roller for tabletop RPGs. It lets you:

- roll classic formulas such as `1d20 + 5` or `2d6 + 3`
- roll multiple formulas at once
- use advanced rules directly inside the formula
- reroll a formula from history
- save favorites
- use special modes such as `Advantage`, `Disadvantage`, and `Even/Odd`

## 2. Quick Formula Reading

A formula usually follows this pattern:

`NdX + modifier`

Examples:

- `1d20`
- `1d20 + 5`
- `2d6 + 3`
- `4d8 - 1`
- `3d6 + 1d4 + 2`

Meaning:

- `N` = number of dice
- `dX` = die type, meaning the number of sides
- `+ 2` or `- 1` = a modifier added to or subtracted from the total

Example:

- `2d6 + 3` rolls two six-sided dice, then adds 3 to the final result

![Basic roll example](images/guide-lancer-classique.png)

## 3. Supported Dice

The interface provides quick access to these dice:

- `d4`
- `d6`
- `d8`
- `d10`
- `d12`
- `d20`
- `d100`

You can either click the dice buttons or type the formula manually.

## 4. Classic Mode And Expert Mode

Rollz now includes two formula-building interfaces.

### Classic Mode

- best for fast everyday rolls
- click the dice buttons to build the formula automatically
- use the `MOD` widget for flat bonuses and penalties

### Expert Mode

- switch it on with the mode toggle in the dice card
- the advanced builder appears directly under the toggle
- dice shortcuts, digits, and formula symbols are grouped in one panel for faster input on mobile
- `Advantage`, `Disadvantage`, and `Even/Odd` stay available below the formula bar

![Expert mode builder](images/guide-mode-expert.png)

## 5. Rolling Multiple Formulas At Once

You can separate multiple formulas with a semicolon `;`.

Examples:

- `1d20 + 4; 1d8 + 2`
- `2d6; 2d6; 1d20 + 3`

Each formula is rolled in sequence and Rollz displays one result block per formula.

## 6. Special Modes

### Advantage

`Advantage` only applies to the first dice group of the first formula.

Example:

- with `1d20`, Rollz rolls two dice and keeps the higher one

### Disadvantage

`Disadvantage` also applies only to the first dice group of the first formula.

Example:

- with `1d20`, Rollz rolls two dice and keeps the lower one

### Even/Odd

`Even/Odd` counts successes based on die parity.

Rules:

- an even die counts as `1` success
- an odd die counts as `0`
- only the first dice group is used
- any later dice groups are ignored
- flat modifiers are added to the final total, except on a critical failure
- if all dice from the first roll are even, Rollz performs one bonus reroll and adds the new successes
- if all dice from the first roll are odd, the result drops to `0` with a critical failure

Example:

- `4d6` in `Even/Odd` mode
- if the dice are `2, 3, 4, 5`, that gives `2` successes

Important:

- the result total is still labeled `Successes`
- `Advantage`, `Disadvantage`, and `Even/Odd` are mutually exclusive

## 7. Advanced Formulas

Rollz supports two advanced inline operators written directly after a dice group:

- `>=` to count successes from a threshold
- `R` to reroll certain dice once

### 6.1. Success Threshold: `NdX>=T`

Format:

`NdX>=T`

Examples:

- `8d6>=5`
- `4d10>=8`
- `6d6>=4 + 2`

How it works:

- Rollz rolls the dice
- each die whose final value is greater than or equal to the threshold counts as `1` success
- the displayed total becomes a success count
- flat modifiers still apply

Detailed example:

- `4d6>=5`
- results: `6, 5, 4, 1`
- total successes: `2`

### 6.2. Single Reroll: `NdXRn`

Format:

`NdXRn`

Examples:

- `2d6R2`
- `4d10R1`

How it works:

- each die whose value is less than or equal to `n` is rerolled once
- the final value replaces the old one for total calculation
- Rollz shows both the original value and the kept reroll value

Detailed example:

- `2d6R2`
- first roll: `2, 1`
- rerolls: `6, 5`
- final total: `11`

### 6.3. Reroll + Threshold: `NdXRn>=T`

Format:

`NdXRn>=T`

Example:

- `4d6R2>=5`

How it works:

- rerolls happen first
- the threshold is then evaluated on the final kept values

Detailed example:

- `4d6R2>=5`
- first roll: `1, 2, 4, 6`
- dice `1` and `2` are rerolled
- new values: `5, 3`
- final series: `5, 3, 4, 6`
- successes at `>=5`: `2`

![Advanced formula example](images/guide-formule-avancee.png)

## 8. Compatibility And Limits

### Allowed

- multiple dice groups in one formula: `3d6 + 1d4 + 2`
- multiple formulas with `;`
- positive and negative modifiers
- threshold and reroll syntax in the same advanced formula

### Important Limits

- a formula must contain at least one dice group
- `R` means one reroll per eligible die
- the current advanced syntax is limited to `R` and `>=`
- advanced inline syntax cannot be combined with `Advantage`, `Disadvantage`, or `Even/Odd` on the first formula
- in `Even/Odd` mode, only the first dice group is used

## 9. Useful Examples

### Classic Rolls

- `1d20 + 5`
- `2d6 + 3`
- `3d8 + 1d4 + 2`

### Advanced Formulas

- `8d6>=5`
- `2d6R2`
- `4d6R2>=5`

### Multiple Formulas

- `1d20 + 4; 1d8 + 2`
- `8d6>=5; 2d6R2`

## 10. History And Favorites

### History

Every roll is added to history with:

- the formula
- the total
- a short roll summary
- the mode used

Clicking a history entry automatically rerolls that formula with its saved mode.

### Favorites

You can save a formula from history for quick access later.

Favorites preserve:

- the formula
- the order chosen by the user
- the `Even/Odd` mode if the formula was saved in that mode

When you load a favorite:

- the formula returns to the formula bar
- `Even/Odd` is re-enabled automatically when needed
- focus returns to the formula container without opening the mobile keyboard

![History and favorites](images/guide-historique-favoris.png)

## 11. Practical Tips

- use the dice buttons to avoid syntax mistakes on simple rolls
- use `Expert` mode when you want dice, digits, and operators in one place
- use `;` when you want to prepare several rolls at once
- use `R` for systems that reroll low values
- use `>=` for threshold-based success systems
- use `Even/Odd` when your system counts even dice as successes

## 12. Quick Reference

- `1d20 + 5`: one twenty-sided die plus 5
- `2d6R2`: reroll every die showing `1` or `2` once
- `6d10>=8`: count dice showing `8` or more as successes
- `4d6R2>=5`: rerolls first, then threshold
- `1d20 + 4; 1d8 + 2`: two separate rolls

## 13. If A Formula Does Not Work

Check these points:

- the formula contains at least one dice group
- there is no empty `;` separator
- the advanced suffix is attached directly to the dice group, for example `4d6R2>=5`
- you are not mixing advanced syntax with `Advantage`, `Disadvantage`, or `Even/Odd` on the first formula

If the roll button is disabled, check the preview line below the formula bar: it tells you whether the input is valid.