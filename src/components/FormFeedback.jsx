import './FormFeedback.css';

export default function FormFeedback({ children, tone = 'error', id }) {
 if (!children) return null;
 return <span id={id} className={`form-feedback form-feedback-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</span>;
}
