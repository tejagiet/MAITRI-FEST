import React, { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from '../supabaseClient'

/* ─── helpers ─── */
const GGU_PURPLE = '#3B0764'
const GGU_PURPLE_LIGHT = '#581c87'
const GGU_GOLD = '#D97706'

/* ─── icons (pure SVG, no library needed) ─── */
const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
)

const IconHash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
)

const IconPhone = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.17 3.42 2 2 0 0 1 3.14 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" />
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
export default function MaitriRegistration() {
    const [formData, setFormData] = useState({ name: '', pin: '', mobile: '' })
    const [errors, setErrors] = useState({})
    const [status, setStatus] = useState('idle') // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState('')
    const [downloading, setDownloading] = useState(false)
    const passRef = useRef(null)

    /* ── validation ── */
    const validate = () => {
        const e = {}
        if (!formData.name.trim()) e.name = 'Full name is required'
        if (!formData.pin.trim()) e.pin = 'PIN number is required'
        else if (!/^[A-Z0-9a-z\-]{5,20}$/.test(formData.pin.trim()))
            e.pin = 'PIN must be 5–20 alphanumeric characters or hyphens'
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
                backgroundColor: '#ffffff',
                logging: false,
            })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 152] })
            pdf.addImage(imgData, 'PNG', 0, 0, 100, 152)
            pdf.save(`Maitri_Pass_${formData.pin.trim()}.pdf`)
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

        const { error } = await supabase.from('maitri_registrations').insert([{
            full_name: formData.name.trim(),
            pin_number: formData.pin.trim().toUpperCase(),
            mobile_number: formData.mobile.trim(),
        }])

        if (error) {
            setStatus('error')
            if (error.code === '23505') {
                setErrorMsg('This PIN is already registered. Each PIN can only be used once.')
            } else {
                setErrorMsg(error.message)
            }
        } else {
            setStatus('success')
            // small delay so the pass renders with correct data before auto-download
            setTimeout(() => handleDownload(), 800)
        }
    }

    const handleReset = () => {
        setFormData({ name: '', pin: '', mobile: '' })
        setErrors({})
        setStatus('idle')
        setErrorMsg('')
    }

    /* ─── render ─── */
    return (
        <div
            style={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${GGU_PURPLE} 0%, #1e0a38 40%, #0f0520 100%)`,
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
            {/* Decorative background orbs */}
            <div style={{
                position: 'absolute', top: '-120px', right: '-120px',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-80px', left: '-80px',
                width: '320px', height: '320px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* ──────── HEADER ──────── */}
            <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                    background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.35)',
                    borderRadius: '999px', padding: '0.4rem 1.2rem', marginBottom: '1rem',
                }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FDE68A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Godavari Global University
                    </span>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: GGU_GOLD, display: 'inline-block' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FDE68A', letterSpacing: '0.08em' }}>March 06 & 07, 2026</span>
                </div>

                <h1
                    className="shimmer-text"
                    style={{ fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', fontWeight: 900, margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}
                >
                    MAITRI 2026
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', margin: 0 }}>
                    An Annual Youth Carnival of GGUites
                </p>
            </div>

            {/* ──────── CARD ──────── */}
            {status !== 'success' ? (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        width: '100%', maxWidth: '460px', borderRadius: '1.25rem',
                        padding: '2.25rem 2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
                    }}
                >
                    <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginTop: 0, marginBottom: '0.25rem' }}>
                        Student Registration
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: 0, marginBottom: '1.75rem' }}>
                        Fill in your details to get your Entry Pass
                    </p>

                    {status === 'error' && (
                        <div style={{
                            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
                            borderRadius: '0.625rem', padding: '0.875rem 1rem', marginBottom: '1.25rem',
                        }}>
                            <p style={{ color: '#FCA5A5', fontSize: '0.875rem', margin: 0 }}> {errorMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Full Name */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.825rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                                Full Name
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#7C3AED' }}>
                                    <IconUser />
                                </span>
                                <input
                                    id="full-name"
                                    type="text"
                                    className="input-field"
                                    style={{ paddingLeft: '2.6rem' }}
                                    placeholder="Enter Your Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={status === 'loading'}
                                />
                            </div>
                            {errors.name && <p style={{ color: '#FCA5A5', fontSize: '0.78rem', marginTop: '0.3rem', marginBottom: 0 }}>{errors.name}</p>}
                        </div>

                        {/* PIN */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.825rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                                PIN Number <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Student ID / Roll No.)</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#7C3AED' }}>
                                    <IconHash />
                                </span>
                                <input
                                    id="pin-number"
                                    type="text"
                                    className="input-field"
                                    style={{ paddingLeft: '2.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    placeholder="Enter Your Pin Number"
                                    value={formData.pin}
                                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                    disabled={status === 'loading'}
                                />
                            </div>
                            {errors.pin && <p style={{ color: '#FCA5A5', fontSize: '0.78rem', marginTop: '0.3rem', marginBottom: 0 }}>{errors.pin}</p>}
                        </div>

                        {/* Mobile */}
                        <div style={{ marginBottom: '1.75rem' }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.825rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                                Mobile Number
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#7C3AED' }}>
                                    <IconPhone />
                                </span>
                                <input
                                    id="mobile-number"
                                    type="tel"
                                    className="input-field"
                                    style={{ paddingLeft: '2.6rem' }}
                                    placeholder="Enter Your mobile number"
                                    maxLength={10}
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/, '') })}
                                    disabled={status === 'loading'}
                                />
                            </div>
                            {errors.mobile && <p style={{ color: '#FCA5A5', fontSize: '0.78rem', marginTop: '0.3rem', marginBottom: 0 }}>{errors.mobile}</p>}
                        </div>

                        {/* Submit button */}
                        <button
                            id="register-btn"
                            type="submit"
                            disabled={status === 'loading'}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                background: status === 'loading'
                                    ? 'rgba(109,40,217,0.5)'
                                    : `linear-gradient(135deg, #6D28D9 0%, ${GGU_PURPLE} 100%)`,
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: 700,
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: '0.01em',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                boxShadow: status === 'loading' ? 'none' : '0 4px 20px rgba(109,40,217,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                            }}
                            onMouseEnter={(e) => { if (status !== 'loading') { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 28px rgba(109,40,217,0.65)' } }}
                            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(109,40,217,0.5)' }}
                        >
                            {status === 'loading' ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Registering…
                                </>
                            ) : (
                                'Register & Get Pass'
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: '0.75rem', marginTop: '1.25rem', marginBottom: 0 }}>
                        Your data is stored securely. Each PIN can only register once.
                    </p>
                </div>

            ) : (
                /* ──────── SUCCESS STATE ──────── */
                <div className="animate-scale-in" style={{ textAlign: 'center', width: '100%', maxWidth: '480px' }}>
                    {/* Success badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #059669, #10B981)',
                        boxShadow: '0 0 32px rgba(16,185,129,0.5)',
                        marginBottom: '1rem', color: '#fff',
                    }}>
                        <IconCheck />
                    </div>

                    <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
                        Registration Successful! 
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.75rem' }}>
                        Your Entry Pass for Maitri 2026 is ready
                    </p>

                    {/* ── ENTRY PASS (on-screen) ── */}
                    <div
                        ref={passRef}
                        id="pass-to-print"
                        style={{
                            background: '#fff',
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                            border: `2px solid #E5E7EB`,
                            width: '100%',
                            maxWidth: '380px',
                            margin: '0 auto 1.5rem',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        {/* Pass Header */}
                        <div style={{
                            background: '#ffffff',
                            padding: '1.25rem 1.25rem 1rem',
                            textAlign: 'center',
                            position: 'relative',
                            borderBottom: '2px solid #F3F4F6'
                        }}>
                            <h3 style={{ color: '#1E3A8A', fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.15rem', letterSpacing: '0.05em' }}>
                                <span style={{ color: '#E11D48' }}>GGU</span> MAITRI
                            </h3>
                            <p style={{ color: '#4B5563', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                                Godavari Global University
                            </p>
                            <p style={{ color: '#6B7280', fontSize: '0.75rem', fontStyle: 'italic', margin: '0 0 0.75rem' }}>
                                An Annual Youth Carnival of GGUites
                            </p>

                            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: '#F9FAFB', padding: '0.3rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                                <span style={{ color: '#1E3A8A', fontWeight: 700, fontSize: '0.85rem' }}>March</span>
                                <span style={{ background: '#E11D48', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', fontWeight: 800, fontSize: '1rem' }}>06 & 07</span>
                                <span style={{ color: '#1E3A8A', fontWeight: 700, fontSize: '0.85rem' }}>2026</span>
                            </div>
                        </div>

                        {/* Pass Body (Concert vibe colors to match pamphlet middle) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                            position: 'relative',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            overflow: 'hidden'
                        }}>
                            {/* Colorful neon light effects in the background */}
                            <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '130px', height: '130px', background: 'radial-gradient(circle, rgba(236,72,153,0.5) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '130px', height: '130px', background: 'radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                            <p style={{ color: '#FDE047', fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.08em', margin: '0 0 1.25rem', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.6)', zIndex: 1, textAlign: 'center' }}>
                                Dare to Dream <br /> Compete to Win
                            </p>

                            {/* Student info card styled distinctively */}
                            <div style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: '0.75rem',
                                padding: '1.25rem 1rem',
                                marginBottom: '1.25rem',
                                zIndex: 1
                            }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#D1D5DB', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>
                                    Student
                                </p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.85rem', letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {formData.name.toUpperCase()}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>
                                            PIN / ID
                                        </p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F3F4F6', margin: 0, letterSpacing: '0.08em' }}>
                                            {formData.pin.toUpperCase()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>
                                            Mobile
                                        </p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F3F4F6', margin: 0 }}>
                                            {formData.mobile}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code section */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '0.5rem',
                                padding: '0.4rem',
                                border: '2px solid rgba(255,255,255,0.8)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                marginBottom: '0.5rem',
                                zIndex: 1
                            }}>
                                <QRCodeCanvas
                                    value={formData.pin.trim().toUpperCase() || 'MAITRI2026'}
                                    size={100}
                                    fgColor="#000000"
                                    bgColor="#ffffff"
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <p style={{ fontSize: '0.65rem', color: '#D1D5DB', margin: '0', textAlign: 'center', zIndex: 1 }}>
                                Scan at entry gate
                            </p>
                        </div>

                        {/* Pass Footer */}
                        <div style={{
                            background: '#ffffff',
                            padding: '0.75rem',
                            textAlign: 'center',
                            borderTop: '2px dashed #E5E7EB'
                        }}>
                            <p style={{ color: '#1E3A8A', fontSize: '0.75rem', fontWeight: 800, margin: '0 0 0.15rem', letterSpacing: '0.02em' }}>
                                GODAVARI GLOBAL UNIVERSITY
                            </p>
                            <p style={{ color: '#6B7280', fontSize: '0.6rem', fontWeight: 500, margin: '0' }}>
                                Chaitanya Knowledge City, NH-16, Rajamahendravaram
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            id="download-pass-btn"
                            onClick={handleDownload}
                            disabled={downloading}
                            className="animate-pulse-glow"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.8rem 1.5rem', borderRadius: '0.75rem',
                                background: `linear-gradient(135deg, ${GGU_GOLD}, #B45309)`,
                                color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                                border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
                                fontFamily: "'Inter', sans-serif",
                                opacity: downloading ? 0.7 : 1,
                            }}
                        >
                            <IconDownload />
                            {downloading ? 'Generating…' : 'Download Entry Pass PDF'}
                        </button>

                        <button
                            id="register-another-btn"
                            onClick={handleReset}
                            style={{
                                padding: '0.8rem 1.5rem', borderRadius: '0.75rem',
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: 600,
                                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Register Another
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', marginTop: '2rem', marginBottom: 0, textAlign: 'center' }}>
                © 2026 Godavari Global University • Maitri Cultural Fest • Developed By TEJA • GIET Polytechnic College • 24295-AI-038
            </p>

            {/* Spinner keyframe */}
            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    )
}

