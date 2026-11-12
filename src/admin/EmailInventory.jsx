import { emailInventory } from '../../shared/email-inventory.js';

export default function EmailInventory() {
 return <details className="tp-card"><summary>Website emails: triggers, recipients and off switches</summary>
  <p>RCBC can keep only the emails it needs. Server settings are managed by the site maintainer.</p>
  {emailInventory.map(item=><article key={item.name}><h3>{item.name}</h3><dl><dt>What causes it</dt><dd>{item.trigger}</dd><dt>Who receives it</dt><dd>{item.recipient}</dd><dt>How to switch it off</dt><dd>{item.off}</dd></dl></article>)}
  <p>Subscriptions, unsubscribe confirmations, trainer approval decisions and administrator invitations do not send emails automatically. Invitations are shared manually; subscription status is shown on screen.</p>
 </details>;
}
