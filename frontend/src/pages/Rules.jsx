import React from 'react'

export default function Rules() {
  return (
    <div className="reveal">
      <div className="page-header">
        <h1>Library Rules & Guidelines</h1>
        <p>Please read and adhere to the following community standards to ensure a great experience for everyone.</p>
      </div>

      <div className="glass-card" style={{ padding: '40px', background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          <RuleItem 
            title="Borrowing Limit" 
            desc="Members are allowed to borrow up to 3 books at any given time. This ensures equitable access to our collection for all members." 
            icon="🔢"
          />
          
          <RuleItem 
            title="Standard Loan Period" 
            desc="The standard loan duration is 14 days. Please ensure timely returns. Renewals may be requested if the book is not waitlisted." 
            icon="📅"
          />
          
          <RuleItem 
            title="Overdue Policy" 
            desc="A daily fine of ₹5.00 will be charged for each day beyond the due date. Unpaid fines may result in a temporary suspension of borrowing privileges." 
            icon="⚠️"
          />
          
          <RuleItem 
            title="Care & Handling" 
            desc="Books must be returned in their original condition. Please avoid highlighting, writing, or dog-earing pages. Damage fees will be applied for lost or destroyed items." 
            icon="📖"
          />

          <RuleItem 
            title="Account Suspension" 
            desc="The administration reserves the right to suspend or deactivate accounts that repeatedly violate these guidelines." 
            icon="⛔"
          />

          <RuleItem 
            title="Quiet Environment" 
            desc="When visiting the physical library premises, please maintain silence and respect the study environment of others." 
            icon="🤫"
          />

        </div>
      </div>
    </div>
  )
}

function RuleItem({ title, desc, icon }) {
  return (
    <div style={{ 
      display: 'flex', gap: '20px', 
      padding: '24px', borderRadius: '16px',
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.03)'
    }}>
      <div style={{ 
        fontSize: '28px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'rgba(245, 158, 11, 0.1)'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.3px' }}>{title}</div>
        <div style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}
