import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UserProfileProvider } from './hooks/useUserProfile'
import { ExpensesProvider } from './hooks/useExpenses'
import { MonthlyIncomeProvider } from './hooks/useMonthlyIncome'
import { VatReportingLogProvider } from './hooks/useVatReportingLog'
import { SafetyNetBalanceProvider } from './hooks/useSafetyNetBalance'
import Layout from './components/Layout'
import Onboarding from './pages/Onboarding'
import MonthlyInput from './pages/MonthlyInput'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <UserProfileProvider>
      <ExpensesProvider>
        <MonthlyIncomeProvider>
          <VatReportingLogProvider>
            <SafetyNetBalanceProvider>
              <BrowserRouter basename="/osec-calc">
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="onboarding" element={<Onboarding />} />
                    <Route path="monthly" element={<MonthlyInput />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </SafetyNetBalanceProvider>
          </VatReportingLogProvider>
        </MonthlyIncomeProvider>
      </ExpensesProvider>
    </UserProfileProvider>
  )
}
