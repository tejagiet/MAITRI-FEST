import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import MaitriRegistration from './components/MaitriRegistration'
import VipRegistration from './components/VipRegistration'
import FacultyRegistration from './components/FacultyRegistration'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MaitriRegistration />} />
                <Route path="/vip-access-only" element={<VipRegistration />} />
                <Route path="/faculty-access-only" element={<FacultyRegistration />} />
            </Routes>
            <Analytics />
        </BrowserRouter>
    )
}

export default App
