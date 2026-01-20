import PageContainer from '@/components/PageContainer'
import WeightTracker from '@/components/weights/WeightTracker'

export default function Home() {
  return (
    <PageContainer>
      <div style={{ display: 'grid', gap: 20 }}>
        <div>
          <h1>LiftLog – Workout Tracker</h1>
          <p>Track your lifts and body weight over time.</p>
        </div>

        <WeightTracker />
      </div>
    </PageContainer>
  )
}
