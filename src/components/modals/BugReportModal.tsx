import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { overlayStyle, modalStyle, modalHeaderStyle, closeBtnStyle, labelStyle, inputStyle } from './shared';

export function BugReportModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', department: '', email: '', description: '', priority: 'medium' });
  const t = useTranslation('bugReportModal');

  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    const title = encodeURIComponent(`[Bug] ${formData.description.substring(0, 80)}`);
    const body = encodeURIComponent(
      `## Bug Report\n\n**Name:** ${formData.name}\n**Department:** ${formData.department}\n**Email:** ${formData.email}\n**Priority:** ${formData.priority}\n\n### Description\n${formData.description}\n\n---\n*Reported via Bangladesh Code Bug Report Modal*`
    );
    const labels = encodeURIComponent('bug');
    window.open(`https://github.com/beingniloy/bdcode/issues/new?title=${title}&body=${body}&labels=${labels}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: '500px' }} role="dialog" aria-modal="true" aria-labelledby="bug-report-modal-title">
        <div style={modalHeaderStyle}>
          <h3 id="bug-report-modal-title" style={{ margin: 0, fontSize: '13px', color: 'var(--gov-green)' }}>{t('title')}</h3>
          <button onClick={onClose} style={closeBtnStyle} aria-label={t('close')}><X size={16} /></button>
        </div>
        {submitted ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <CheckCircle2 size={42} color="var(--success-color)" />
            <p style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.5, color: 'var(--text-primary)' }}>{t('success')}</p>
            <button onClick={onClose} aria-label={t('close')} style={{ background: 'var(--gov-green)', color: 'white', padding: '6px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>{t('close')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>{t('name')}</label><input type="text" required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('department')}</label><input type="text" required value={formData.department} onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div><label style={labelStyle}>{t('email')}</label><input type="email" required value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('priority')}</label><select value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))} style={inputStyle}>
              <option value="low">{t('low')}</option><option value="medium">{t('medium')}</option><option value="high">{t('high')}</option>
            </select></div>
            <div><label style={labelStyle}>{t('description')}</label><textarea rows={4} required value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} /></div>
            <button type="submit" style={{ background: 'var(--gov-green)', color: 'white', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-end', marginTop: '10px' }}>{t('submit')}</button>
          </form>
        )}
      </div>
    </div>
  );
}
