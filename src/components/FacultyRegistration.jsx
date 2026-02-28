import React, { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from '../supabaseClient'

/* ─── helpers ─── */
const FACULTY_SILVER = '#CBD5E1'
const FACULTY_NAVY = '#1E1B4B'
const FACULTY_ACCENT = '#6366F1'

/* ─── icons ─── */
const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
)

const IconAward = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
)

const IconPhone = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.17 3.42 2 2 0 0 1 3.14 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
)

const IconLock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

const IconDownload = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
)

const IconCheck = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

/* ─── component ─── */
export default function FacultyRegistration() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [authError, setAuthError] = useState('')

    const [formData, setFormData] = useState({ name: '', designation: 'Faculty', mobile: '' })
    const [errors, setErrors] = useState({})
    const [status, setStatus] = useState('idle') // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState('')
    const [downloading, setDownloading] = useState(false)
    const [generatedFacCode, setGeneratedFacCode] = useState('')
    const passRef = useRef(null)

    /* ── Faculty Authentication ── */
    const handleAuth = (e) => {
        e.preventDefault()
        if (passwordInput === 'MAITRIFACULTY26') {
            setIsAuthenticated(true)
            setAuthError('')
        } else {
            setAuthError('Incorrect Faculty Passcode')
        }
    }

    /* ── validation ── */
    const validate = () => {
        const e = {}
        if (!formData.name.trim()) e.name = 'Full name is required'
        if (!formData.mobile.trim()) e.mobile = 'Mobile number is required'
        else if (!/^[6-9]\d{9}$/.test(formData.mobile.trim()))
            e.mobile = 'Enter a valid 10-digit Indian mobile number'
        return e
    }

    /* ── PDF download ── */
    const handleDownload = async () => {
        if (!passRef.current) return
        setDownloading(true)
        try {
            const canvas = await html2canvas(passRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#1e1b4b', // Navy bg for Faculty
                logging: false,
            })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 155] })
            pdf.addImage(imgData, 'PNG', 0, 0, 100, 155)
            pdf.save(`Faculty_Pass_${formData.name.replace(/\s+/g, '_')}.pdf`)
        } catch (err) {
            console.error('PDF generation error:', err)
        } finally {
            setDownloading(false)
        }
    }

    /* ── form submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationErrors = validate()
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }
        setErrors({})
        setStatus('loading')

        // Generate a unique Faculty Code (e.g. FAC-8492)
        const newFacCode = `FAC-${Math.floor(1000 + Math.random() * 9000)}`

        const { error } = await supabase.from('maitri_faculty_registrations').insert([{
            full_name: formData.name.trim(),
            designation: formData.designation,
            mobile_number: formData.mobile.trim(),
            fac_code: newFacCode
        }])

        if (error) {
            setStatus('error')
            setErrorMsg(error.message)
        } else {
            setGeneratedFacCode(newFacCode)
            setStatus('success')
            // delay so pass renders before auto-download
            setTimeout(() => handleDownload(), 800)
        }
    }

    const handleReset = () => {
        setFormData({ name: '', designation: 'Faculty', mobile: '' })
        setErrors({})
        setStatus('idle')
        setErrorMsg('')
        setGeneratedFacCode('')
    }

    /* ─── render ─── */
    return (
        <div
            style={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)`, // Deep Blue theme
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Elegant Silver/Blue Glow Orbs */}
            <div style={{
                position: 'absolute', top: '10%', right: '20%',
                width: '300px', height: '300px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(148,163,184,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '10%', left: '20%',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* ──────── HEADER ──────── */}
            <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '2.5rem', zIndex: 10 }}>
                <span style={{
                    display: 'inline-block', padding: '0.3rem 1rem', borderRadius: '999px',
                    border: '1px solid #94A3B8', color: '#94A3B8', fontSize: '0.75rem',
                    fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem'
                }}>
                    Academic Excellence
                </span>
                <h1 style={{
                    color: '#fff', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300,
                    margin: '0 0 0.5rem', letterSpacing: '0.1em'
                }}>
                    FACULTY <span style={{ fontWeight: 800, color: FACULTY_SILVER }}>PORTAL</span>
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0, letterSpacing: '0.05em' }}>
                    Godavari Global University • MAITRI 2026
                </p>
            </div>

            {/* ──────── AUTHENTICATION SCREEN ──────── */}
            {!isAuthenticated ? (
                <div className="glass-card animate-scale-in" style={{
                    width: '100%', maxWidth: '380px', borderRadius: '1rem',
                    padding: '2.5rem 2rem', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(148,163,184,0.2)', backdropFilter: 'blur(12px)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(148,163,184,0.1)', display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center', color: FACULTY_SILVER,
                            marginBottom: '1rem'
                        }}>
                            <IconLock />
                        </div>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Faculty Access</h2>
                    </div>

                    <form onSubmit={handleAuth}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <input
                                type="password"
                                placeholder="Enter Faculty Passcode"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem',
                                    background: 'rgba(0,0,0,0.5)', border: '1px solid #334155',
                                    color: '#fff', fontSize: '1rem', outline: 'none',
                                    textAlign: 'center', letterSpacing: '0.2em'
                                }}
                            />
                            {authError && <p style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>{authError}</p>}
                        </div>
                        <button type="submit" style={{
                            width: '100%', padding: '0.875rem', borderRadius: '0.5rem',
                            background: FACULTY_SILVER, color: '#0f172a', fontWeight: 700,
                            border: 'none', cursor: 'pointer', fontSize: '0.95rem'
                        }}>
                            Unlock Faculty Portal
                        </button>
                    </form>
                </div>
            ) : status !== 'success' ? (
                /* ──────── FACULTY REGISTRATION FORM ──────── */
                <div className="glass-card animate-fade-in-up" style={{
                    width: '100%', maxWidth: '480px', borderRadius: '1.25rem',
                    padding: '2.5rem 2.25rem', background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(148,163,184,0.3)', backdropFilter: 'blur(16px)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}>
                    <h2 style={{ color: FACULTY_SILVER, fontSize: '1.25rem', fontWeight: 600, marginTop: 0, marginBottom: '0.25rem' }}>
                        Issue Faculty Pass
                    </h2>
                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: 0, marginBottom: '2rem' }}>
                        Generate an official entry pass for faculty and administration members.
                    </p>

                    {status === 'error' && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem',
                        }}>
                            <p style={{ color: '#FCA5A5', fontSize: '0.85rem', margin: 0 }}>⚠️ {errorMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Full Name */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: FACULTY_ACCENT }}><IconUser /></span>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '0.5rem',
                                        background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', color: '#fff', outline: 'none'
                                    }}
                                    placeholder="e.g. Prof. R. S. Rao"
                                    disabled={status === 'loading'}
                                />
                            </div>
                            {errors.name && <p style={{ color: '#FCA5A5', fontSize: '0.75rem', marginTop: '0.3rem', marginBottom: 0 }}>{errors.name}</p>}
                        </div>

                        {/* Designation Selection */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Designation / Role</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: FACULTY_ACCENT }}><IconAward /></span>
                                <select
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '0.5rem',
                                        background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', color: '#fff', outline: 'none',
                                        appearance: 'none', cursor: 'pointer'
                                    }}
                                    disabled={status === 'loading'}
                                >
                                    <option value="Principal">Principal</option>
                                    <option value="Vice Principal">Vice Principal</option>
                                    <option value="HOD">Head of Department (HOD)</option>
                                    <option value="Faculty">Faculty Member</option>
                                    <option value="Staff">Administrative Staff</option>
                                </select>
                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: FACULTY_ACCENT, pointerEvents: 'none' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </span>
                            </div>
                        </div>

                        {/* Mobile */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', color: '#CBD5E1', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mobile Number</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: FACULTY_ACCENT }}><IconPhone /></span>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/, '') })}
                                    style={{
                                        width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '0.5rem',
                                        background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', color: '#fff', outline: 'none'
                                    }}
                                    placeholder="10-digit number"
                                    disabled={status === 'loading'}
                                />
                            </div>
                            {errors.mobile && <p style={{ color: '#FCA5A5', fontSize: '0.75rem', marginTop: '0.3rem', marginBottom: 0 }}>{errors.mobile}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '0.5rem', border: 'none',
                                background: status === 'loading' ? '#334155' : `linear-gradient(90deg, #64748B, #CBD5E1, #64748B)`,
                                color: '#0f172a', fontSize: '1rem', fontWeight: 800, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            {status === 'loading' ? 'Generating Pass...' : 'Generate Faculty Pass'}
                        </button>
                    </form>
                </div>
            ) : (
                /* ──────── SUCCESS & FACULTY PASS PREVIEW ──────── */
                <div className="animate-scale-in" style={{ textAlign: 'center', width: '100%', maxWidth: '420px', zIndex: 10 }}>
                    <h2 style={{ color: FACULTY_SILVER, fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem' }}>Pass Generated</h2>
                    <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>Faculty credentials issued successfully.</p>

                    {/* ── FACULTY PASS (on-screen) ── */}
                    <div
                        ref={passRef}
                        id="faculty-pass-to-print"
                        style={{
                            background: '#1e1b4b', // Navy Blue
                            borderRadius: '0.75rem',
                            overflow: 'hidden',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                            border: `2px solid #334155`,
                            width: '100%',
                            maxWidth: '360px',
                            margin: '0 auto 1.5rem',
                            fontFamily: "'Inter', sans-serif",
                            position: 'relative'
                        }}
                    >
                        {/* Silver Border Top */}
                        <div style={{ height: '6px', background: 'linear-gradient(90deg, #475569, #CBD5E1, #475569)' }} />

                        {/* Header */}
                        <div style={{ padding: '1.5rem 1.5rem 1rem', textAlign: 'center', borderBottom: '1px solid #334155' }}>
                            <p style={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                                Godavari Global University
                            </p>
                            <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 200, letterSpacing: '0.15em', margin: '0' }}>
                                MAITRI<span style={{ fontWeight: 800, color: FACULTY_SILVER }}>'26</span>
                            </h2>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '2rem 1.5rem', textAlign: 'center', position: 'relative' }}>
                            {/* Giant faded FACULTY text in background */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                fontSize: '4.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.03)', pointerEvents: 'none', zIndex: 0
                            }}>
                                FACULTY
                            </div>

                            <p style={{ color: FACULTY_SILVER, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.2em', margin: '0 0 1rem', position: 'relative', zIndex: 1 }}>
                                {formData.designation.toUpperCase()}
                            </p>

                            <h3 style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem', position: 'relative', zIndex: 1 }}>
                                {formData.name.toUpperCase()}
                            </h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500, margin: '0 0 2rem', position: 'relative', zIndex: 1 }}>
                                GGU Academic Staff
                            </p>

                            <div style={{
                                background: '#ffffff', padding: '0.5rem', borderRadius: '0.5rem',
                                display: 'inline-block', position: 'relative', zIndex: 1
                            }}>
                                <QRCodeCanvas
                                    value={generatedFacCode || 'FACULTY'}
                                    size={110}
                                    fgColor="#000000"
                                    bgColor="#ffffff"
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.75rem' }}>
                                ID: {generatedFacCode}
                            </p>
                        </div>

                        {/* Footer */}
                        <div style={{ background: '#0f172a', padding: '1rem', textAlign: 'center', borderTop: '1px solid #334155' }}>
                            <p style={{ color: FACULTY_SILVER, fontSize: '0.75rem', fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>
                                OFFICIAL ENTRY • MARCH 06-07
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="animate-pulse-glow"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.8rem 1.5rem', borderRadius: '0.5rem',
                                background: `linear-gradient(90deg, #475569, #94A3B8)`,
                                color: '#0f172a', fontSize: '0.9rem', fontWeight: 700,
                                border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
                                opacity: downloading ? 0.7 : 1,
                            }}
                        >
                            <IconDownload />
                            {downloading ? 'Downloading...' : 'Download Pass'}
                        </button>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '0.8rem 1.5rem', borderRadius: '0.5rem',
                                background: 'transparent', border: '1px solid #334155',
                                color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Issue Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
