import { Link } from 'react-router-dom';
import { RiStickyNoteFill } from 'react-icons/ri';
import './EmptyState.css';

const EmptyState = ({ 
  title, 
  message, 
  actionText, 
  actionLink, 
  onAction 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <RiStickyNoteFill />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionText && (
        actionLink ? (
          <Link to={actionLink} className="empty-state-btn">
            {actionText}
          </Link>
        ) : (
          <button onClick={onAction} className="empty-state-btn">
            {actionText}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
