import { createPortal } from 'react-dom';
import { emailInventory } from '../../shared/email-inventory.js';
import './EmailInventory.css';

function printInventory() {
  document.body.classList.add('printing-email-inventory');
  try {
    window.print();
  } finally {
    document.body.classList.remove('printing-email-inventory');
  }
}

export default function EmailInventory() {
  return <>
    <details className="tp-card email-inventory">
      <summary>Website emails: triggers, recipients, actions and off switches</summary>
      <p>RCBC can choose which emails it needs. Server settings are managed by the site maintainer.</p>
      <button type="button" className="tp-btn tp-btn-ghost" onClick={printInventory}>
        Print / save PDF
      </button>
      <div className="email-inventory-entries">
        {emailInventory.map(item => (
          <article key={item.name}>
            <h3>{item.name}</h3>
            <dl>
              <dt>What causes it</dt>
              <dd>{item.trigger}</dd>
              <dt>Who receives it</dt>
              <dd>{item.recipient}</dd>
              <dt>Action for the recipient</dt>
              <dd>{item.action}</dd>
              <dt>How to switch it off</dt>
              <dd>{item.off}</dd>
            </dl>
          </article>
        ))}
      </div>
      <p>Invitation links are shared manually. Signup and unsubscribe results appear on screen. Trainer decisions are recorded in the portal.</p>
    </details>
    {createPortal(
      <section className="email-inventory-sheet" aria-label="RCBC notification approval list">
        <h1>RCBC notification approval list</h1>
        <p>Select the email types RCBC considers essential. Server settings are managed by the site maintainer.</p>
        <table>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Trigger</th>
              <th scope="col">Recipient</th>
              <th scope="col">Action for recipient</th>
              <th scope="col">How to disable</th>
            </tr>
          </thead>
          <tbody>
            {emailInventory.map(item => (
              <tr key={item.name}>
                <th scope="row">{item.name}</th>
                <td>{item.trigger}</td>
                <td>{item.recipient}</td>
                <td>{item.action}</td>
                <td>{item.off}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Invitation links are shared manually. Signup and unsubscribe results appear on screen. Trainer decisions are recorded in the portal.</p>
        <p>RCBC approved email types ________________________________________________________</p>
        <p>Reviewer ______________________________ Date ______________________________</p>
      </section>,
      document.body,
    )}
  </>;
}
