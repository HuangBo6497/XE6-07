import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import Workbench from './pages/Workbench'
import AuditRepair from './pages/AuditRepair'
import SliceChecklist from './pages/SliceChecklist'
import Projects from './pages/Projects'
import PrintJobs from './pages/PrintJobs'
import Community from './pages/Community'
import Devices from './pages/Devices'
import Materials from './pages/Materials'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Workbench />} />
          <Route path="/audit" element={<AuditRepair />} />
          <Route path="/slices" element={<SliceChecklist />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/prints" element={<PrintJobs />} />
          <Route path="/community" element={<Community />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/materials" element={<Materials />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
