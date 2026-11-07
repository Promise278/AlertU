import CampusMap from '../components/map/CampusMap'
import './CampusMap.css'

function CampusMapPage() {
  return (
    <div className="campus-map-page">
      <div className="campus-map-page-heading">
        <div>
          <p className="pulse-eyebrow">CAMPUS SAFETY</p>
          <h1>Campus Map</h1>
          <p>Explore reported safety incidents around your campus.</p>
        </div>
      </div>

      <CampusMap />
    </div>
  )
}

export default CampusMapPage