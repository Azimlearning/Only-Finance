import { Icon } from '../icons'
import { useMemo } from 'react'
import { ORACLE } from '../../engine'
import type { OracleCase } from '../../engine'
import { fmtMYR, fmtNum, fmtPct, fmtRate, fmtUSD } from '../format'
import { Card, Pill, TabPanel } from '../kit'
import { useCopy } from '../copy'
import { Term } from '../Term'

function fmtUnit(unit: OracleCase['unit'], n: number): string {
  switch (unit) {
    case 'rate':
      return fmtRate(n)
    case 'MYR':
      return fmtMYR(n)
    case 'USD':
      return fmtUSD(n)
    case 'pct':
      return fmtPct(n, 4)
    case 'ratio':
      return n.toFixed(6)
    default:
      return fmtNum(n, 4)
  }
}

export function VerifyTab() {
  const c = useCopy()
  const rows = useMemo(
    () =>
      ORACLE.map((c) => {
        let actual = NaN
        try {
          actual = c.actual()
        } catch {
          actual = NaN
        }
        const ok = Number.isFinite(actual) && Math.abs(actual - c.expected) <= c.tolerance
        return { c, actual, ok }
      }),
    [],
  )
  const passed = rows.filter((r) => r.ok).length
  const all = passed === rows.length
  return (
    <TabPanel
      id="verify"
      title="Checked against the lecturer's workbook"
      intro={c.verifyIntro}
    >
      <Card
        testid="card-verify"
        title={
          <span data-testid="verify-summary" className="flex flex-wrap items-baseline gap-x-3">
            <span className="num text-[2rem] font-semibold leading-none">
              {passed}/{rows.length}
            </span>{' '}
            <span className="text-base font-normal text-fg-muted">match the lecturer&apos;s workbook and Week 10 guide</span>
          </span>
        }
        action={all ? undefined : <Pill tone="red">{rows.length - passed} checks fail</Pill>}
      >
        <div className="overflow-x-auto rounded-lg ring-1 ring-fg/[0.07]">
          <table className="w-full text-[14px]">
            <thead className="label bg-sunken text-left">
              <tr>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">What is checked</th>
                <th className="px-4 py-2 text-right">Engine value</th>
                <th className="px-4 py-2 text-right">Expected</th>
                <th className="px-4 py-2 text-center">
                  <Term id="verifyMatch">Match</Term>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {rows.map(({ c, actual, ok }, i) => (
                <tr key={c.id} className={ok ? 'hover:bg-sunken' : 'bg-danger-tint'}>
                  <td className="px-4 py-2 text-fg-muted">{i > 0 && rows[i - 1].c.source === c.source ? '' : c.source}</td>
                  <td className="px-4 py-2 font-medium text-fg">{c.description}</td>
                  <td className="num px-4 py-2 text-right text-fg">{fmtUnit(c.unit, actual)}</td>
                  <td className="num px-4 py-2 text-right text-fg">{fmtUnit(c.unit, c.expected)}</td>
                  <td className={`px-4 py-2 text-center text-base font-medium ${ok ? 'text-accent' : 'text-danger'}`}>
                    <Icon name={ok ? 'verified' : 'warning'} size={16} className="inline" />
                    <span className="sr-only">{ok ? 'match' : 'no match'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </TabPanel>
  )
}
