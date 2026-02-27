import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MaitriRegistration from './components/MaitriRegistration'
import VipRegistration from './components/VipRegistration'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MaitriRegistration />} />
                <Route path="/vip-access-only" element={<VipRegistration />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
