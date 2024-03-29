// @ts-check

import {
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TextField,
} from '@mui/material';
import { produce } from 'immer';
import { useCallback, useMemo } from 'react';
import { NumberFormatter } from './cells/internal';
import { NumericInput } from './inputs';
import { PricingTableRow as TableRow } from './stylized';
import {
  aggregate as aggregateUtil,
  safeFlexRender,
  toCostNames,
  unique,
} from './utils';

/**
 * The totals table.
 * @param {import("./prop-types").TotalsTableProps} props
 * @returns {JSX.Element}
 */
export function TotalsTable({ quote, setQuote, table }) {
  const aggregate = useCallback(
    /**
     * @param {string} column
     * @returns {(number|undefined)}
     */
    (column) => aggregateUtil(table, column),
    [table],
  );

  const getCMTotalSellingPrice = useCallback(
    /** @returns {number} */
    () =>
      (aggregate('totalVariableCosts') ?? 0) /
      ((100 - (quote.manual_contribution_percent ?? 0)) / 100),
    [aggregate, quote.manual_contribution_percent],
  );

  const dynamicCostNames = quote.products.flatMap(toCostNames).filter(unique);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{/* Padding for correct layout */}</TableCell>
            <TableCell>Price on target contribution %</TableCell>
            <TableCell>Price on manual entry</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Total Selling Price Row */}
          <TableRow>
            <TableCell variant="head">Total Selling Price</TableCell>
            <TableCell>
              <NumberFormatter
                value={getCMTotalSellingPrice()}
                variant="currency"
              />
            </TableCell>
            <TableCell>
              <TextField
                size="small"
                inputMode="decimal"
                fullWidth
                value={quote.manual_total_selling_price ?? 0}
                onChange={(e) => {
                  setQuote(
                    produce(
                      (/** @type {import('./data-types').Quote} */ draft) => {
                        draft.manual_total_selling_price = Number(
                          e.target.value,
                        );
                      },
                    ),
                  );
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                  inputComponent: /** @type {any} */ (NumericInput),
                }}
              />
            </TableCell>
          </TableRow>
          {dynamicCostNames.map((name) => (
            <SimpleTotalsTableRow
              key={name}
              table={table}
              column={`dynamic-cost-${name}`}
              title={name}
            />
          ))}
          <SimpleTotalsTableRow
            table={table}
            column="creditCardFee"
            title="Credit Card Fee"
          />
          <SimpleTotalsTableRow
            table={table}
            column="totalVariableCosts"
            title="Total Variable Costs"
          />
          <SimpleTotalsTableRow
            table={table}
            column="estimated_hours"
            title="Estimated Hours"
          />
          {/* This is  */}
          <ContributionRows
            profitMarginTotalPrice={getCMTotalSellingPrice()}
            totalVariableCosts={aggregate('totalVariableCosts') ?? 0}
            estimatedTotalHours={aggregate('estimated_hours') ?? 0}
            state={{
              manualPrice: quote.manual_total_selling_price ?? 0,
            }}
            slots={{
              marginInput: (
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={quote.manual_contribution_percent ?? 0}
                  onChange={(e) => {
                    setQuote(
                      produce(
                        (/** @type {import('./data-types').Quote} */ draft) => {
                          draft.manual_contribution_percent = Number(
                            e.target.value,
                          );
                        },
                      ),
                    );
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                    inputComponent: /** @type {any} */ (NumericInput),
                    inputProps:
                      /** @type {import('react-number-format').NumericFormatProps|any} */ ({
                        allowNegative: false,
                        min: 0,
                        max: 100,
                      }),
                  }}
                />
              ),
            }}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * All the contribution-related components.
 *
 * Their calculations are very closely related, so this component calculates
 * them all.
 *
 * @param {import('./prop-types').ContributionRowsProps} props
 * @returns {JSX.Element}
 */
function ContributionRows({
  slots: { marginInput },
  state: { manualPrice },
  profitMarginTotalPrice,
  totalVariableCosts,
  estimatedTotalHours,
}) {
  const manualContrib = manualPrice - totalVariableCosts;
  const targetContrib = profitMarginTotalPrice - totalVariableCosts;

  return (
    <>
      {/* Contribution Row */}
      <TableRow>
        <TableCell variant="head">Contribution</TableCell>
        <TableCell>
          <NumberFormatter value={targetContrib} variant="currency" />
        </TableCell>
        <TableCell>
          <NumberFormatter value={manualContrib} variant="currency" />
        </TableCell>
      </TableRow>
      {/* Contribution Margin Row */}
      <TableRow>
        <TableCell variant="head">Contribution %</TableCell>
        <TableCell>{marginInput}</TableCell>
        <TableCell>
          <NumberFormatter
            value={manualPrice === 0 ? undefined : manualContrib / manualPrice}
            variant="percent"
          />
        </TableCell>
      </TableRow>
      {/* Contribution Per Hour Row */}
      <TableRow>
        <TableCell variant="head">Contribution / Hour</TableCell>
        <TableCell>
          <NumberFormatter
            value={
              estimatedTotalHours === 0
                ? undefined
                : targetContrib / estimatedTotalHours
            }
            variant="currency"
          />
        </TableCell>
        <TableCell>
          <NumberFormatter
            value={
              estimatedTotalHours === 0
                ? undefined
                : manualContrib / estimatedTotalHours
            }
            variant="currency"
          />
        </TableCell>
      </TableRow>
    </>
  );
}

/**
 * Used for rows which have three columns that have the same value
 * @param {import('./prop-types').SimpleTotalsTableRowProps} props
 * @returns {JSX.Element}
 */
function SimpleTotalsTableRow({ table, column, title }) {
  // Attempt to cache the footer & context
  const [footer, context] = useMemo(
    () => getFooter(table, column),
    [table, column],
  );

  return (
    <TableRow>
      <TableCell variant="head">{title}</TableCell>
      <TableCell>{safeFlexRender(footer, context)}</TableCell>
      <TableCell>{safeFlexRender(footer, context)}</TableCell>
    </TableRow>
  );
}

/**
 * Gets the footer & context for a column, so it can be passed to flexRender.
 * @template TData
 * @param {import('@tanstack/react-table').Table<TData>} table
 * @param {string} columnId
 * @returns {Parameters<typeof import('@tanstack/react-table').flexRender> | [undefined, undefined]}
 */
function getFooter(table, columnId) {
  const column = table.getColumn(columnId);
  const context = table
    .getFooterGroups()
    .flatMap((g) => g.headers)
    .find((h) => h.id === columnId)
    ?.getContext();

  const footerDef = column?.columnDef.footer;

  if (footerDef && context) {
    // This is *technically* the only thing here that isn't fully type-safe
    // @ts-ignore
    return [footerDef, context];
  }
  return [undefined, undefined];
}
