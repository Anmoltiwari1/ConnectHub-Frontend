/**
 * TOAST COMPONENT
 * ---------------
 * A lightweight notification toast with slide-in animation.
 */
export default function Toast({ message, icon = '💬' }) {
  return (
    <div className="toast">
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}
