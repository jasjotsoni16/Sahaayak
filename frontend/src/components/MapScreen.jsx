import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import API, { BACKEND_ORIGIN } from '../api';

// The map needs a Mapbox token: set REACT_APP_MAPBOX_TOKEN (and optionally REACT_APP_MAPBOX_STYLE)
// in frontend/.env. Without a token the screen explains that instead of showing a broken map.
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const MAPBOX_STYLE = process.env.REACT_APP_MAPBOX_STYLE || 'mapbox://styles/mapbox/outdoors-v12';
mapboxgl.accessToken = MAPBOX_TOKEN;

const HARDCODED_USER_LOCATION = { lng: 76.798698, lat: 30.690418 }; // Chandigarh coordinates

function JobsHeatmap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [allSkills, setAllSkills] = useState([]); // Stores skills from DB
  const [skillColors, setSkillColors] = useState({}); // Maps skill name to color
  const [activeSkills, setActiveSkills] = useState([]); // Skills currently selected for display
  const [modalJobs, setModalJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCoords, setModalCoords] = useState(null);

  // 1. Fetch all skills from the database on component mount
  useEffect(() => {
    API.get('/skills')
      .then(res => {
        setAllSkills(res.data);
        const colors = {};
        const initialActive = [];
        res.data.forEach(skill => {
          colors[skill.name] = skill.color || '#CCCCCC'; // Use DB color, fallback to grey
          initialActive.push(skill.name); // Activate all skills by default
        });
        setSkillColors(colors);
        setActiveSkills(initialActive);
      })
      .catch(err => console.error('Error fetching skills:', err));
  }, []);

  // 2. Get user's real-time location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using hardcoded location.');
      setUserLocation(HARDCODED_USER_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error getting user location:', error);
        setUserLocation(HARDCODED_USER_LOCATION); // Fallback to hardcoded
      }
    );
  }, []);

  // 3. Fetch jobs in a 100km radius around the user's location
  const fetchJobs = async (center) => {
    if (!center) return;
    try {
      const res = await fetch(`${BACKEND_ORIGIN}/api/jobs/jobs-in-radius?center=${center.lng},${center.lat}&radius=100`);
      let jobsData = await res.json();

      // Fetch employer and user details for each job
      const enrichedJobsPromises = jobsData.map(async (job) => {
        let enrichedJob = { ...job };
        if (job.employer) { // Assuming job.employer holds the employer ID
          try {
            const employerRes = await API.getEmployerByUserId(job.employer);
            enrichedJob.employerDetails = employerRes.data;
          } catch (err) {
            console.error(`Error fetching employer details for ID ${job.employer}:`, err);
            enrichedJob.employerDetails = null; // Indicate failure
          }
        }
        if (job.user) { // Assuming job.user holds the job seeker user ID
          try {
            const userRes = await API.getUserById(job.user);
            enrichedJob.userDetails = userRes.data;
          } catch (err) {
            console.error(`Error fetching user details for ID ${job.user}:`, err);
            enrichedJob.userDetails = null; // Indicate failure
          }
        }
        return enrichedJob;
      });

      const enrichedJobs = await Promise.all(enrichedJobsPromises);
      setJobs(enrichedJobs);
    } catch (error) {
      console.error('Error fetching jobs or enriching data:', error);
    }
  };

  // 4. Initialize map when userLocation and skillColors are available
  useEffect(() => {
    if (!MAPBOX_TOKEN || !userLocation || map.current || Object.keys(skillColors).length === 0) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [userLocation.lng, userLocation.lat],
      zoom: 9,
    });

    map.current.on('load', () => {
      fetchJobs(userLocation);

      map.current.addSource('jobs', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add a heatmap layer for each skill
      Object.entries(skillColors).forEach(([skillName, color]) => {
        map.current.addLayer({
          id: `heatmap-${skillName}`,
          type: 'heatmap',
          source: 'jobs',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': 4,
            'heatmap-radius': 13,
            'heatmap-opacity': 0.5,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.01, color,
              0.1, color,
              0.2, 'yellow',
              0.4, 'orange',
              1, 'red'
            ],
          },
          filter: ['==', ['get', 'skill'], skillName],
        });
      });

      // Add user location marker
      userMarker.current = new mapboxgl.Marker({ color: '#0074D9' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    });

    // Cleanup map on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation, skillColors]);

  // 5. Update heatmap layer visibility based on activeSkills
  useEffect(() => {
    if (!map.current) return;
    Object.keys(skillColors).forEach(skillName => {
      const layerId = `heatmap-${skillName}`;
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(
          layerId,
          'visibility',
          activeSkills.includes(skillName) ? 'visible' : 'none'
        );
      }
    });
  }, [activeSkills, skillColors]); // Depend on skillColors to ensure layers exist

  // 6. Update jobs data on map
  useEffect(() => {
    if (!map.current || !jobs) return;

    console.log('Processing jobs data:', jobs);

    const validFeatures = jobs.map(job => {
      // --- Start of Defensive Code ---
      // 1. Check if job and job.location are valid
      if (!job || !job.location || !job.location.coordinates || !Array.isArray(job.location.coordinates) || job.location.coordinates.length !== 2) {
        console.error('Invalid job location data for job:', job);
        return null; // Skip this job
      }

      // 2. Check if coordinates are numbers
      const [lng, lat] = job.location.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        console.error('Invalid coordinates (must be numbers) for job:', job);
        return null; // Skip this job
      }
      
      return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lng, lat]
        },
        properties: {
          skill: job.skills_required && job.skills_required.length > 0 
                 ? allSkills.find(s => s._id === job.skills_required[0])?.name
                 : 'Unknown', // Default skill if none found or skills_required is empty
          count: 1,
          ...job,
        },
      };
    }).filter(feature => feature !== null); // Filter out the null (invalid) features

    console.log('Valid GeoJSON features:', validFeatures);

    const geojson = { type: 'FeatureCollection', features: validFeatures };
    
    const source = map.current.getSource('jobs');
    if (source) {
        source.setData(geojson);
    } else {
        console.error("'jobs' source not found on map.");
    }
  }, [jobs, allSkills]);

  // 7. Refetch jobs and update user marker if userLocation changes
  useEffect(() => {
    if (userLocation) {
      fetchJobs(userLocation);
      if (map.current && userMarker.current) {
        userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
        map.current.setCenter([userLocation.lng, userLocation.lat]);
      }
    }
  }, [userLocation]);

  // 8. Click handler for hotspots (to show job details in modal)
  useEffect(() => {
    if (!map.current) return;
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      // Filter jobs already loaded in frontend for this area (within ~1km radius)
      const jobsNearby = jobs.filter(job => {
        if (!job.location || !job.location.coordinates) return false;
        const [jobLng, jobLat] = job.location.coordinates;
        // Haversine formula for distance calculation
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (jobLat - lat) * Math.PI / 180;
        const dLng = (jobLng - lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(jobLat * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance <= 1; // Within 1 km radius
      });

      if (jobsNearby.length > 0) {
        setModalJobs(jobsNearby);
        setModalCoords({ lng, lat });
        setModalOpen(true);
      } else {
        // Fallback: fetch from backend if no jobs found locally
        fetch(`${BACKEND_ORIGIN}/api/jobs/jobs-in-radius?center=${lng},${lat}&radius=1`)
          .then(res => res.json())
          .then(jobsFetched => {
            setModalJobs(jobsFetched);
            setModalCoords({ lng, lat });
            setModalOpen(true);
          })
          .catch(err => console.error('Error fetching jobs for modal:', err));
      }
    });
  }, [jobs]); // Depend on jobs to re-attach click listener if jobs change

  if (!MAPBOX_TOKEN) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-medium text-ink">The jobs map isn't set up yet.</p>
        <p className="mt-1 text-sm text-muted">Add REACT_APP_MAPBOX_TOKEN to frontend/.env and restart the app.</p>
      </div>
    );
  }

  // Legend and filter UI + Modal
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {/* Legend and Filter */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, background: 'rgba(255,255,255,0.95)',
        padding: 14, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 2,
        minWidth: 180
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Skill Legend & Filter</div>
        {Object.entries(skillColors).map(([skillName, color]) => (
          <div key={skillName} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{
              display: 'inline-block', width: 18, height: 18, background: color,
              borderRadius: 4, marginRight: 8, border: '1px solid #888'
            }} />
            <label style={{ flex: 1, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={activeSkills.includes(skillName)}
                onChange={e => {
                  setActiveSkills(
                    e.target.checked
                      ? [...activeSkills, skillName]
                      : activeSkills.filter(s => s !== skillName)
                  );
                }}
                style={{ marginRight: 4 }}
              />
              {skillName}
            </label>
          </div>
        ))}
      </div>
      {/* Modal for job details */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setModalOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            position: 'relative', maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 22, color: '#333' }}>Jobs in this area</h2>
            {modalJobs.length === 0 ? (
              <div style={{ color: '#888', fontStyle: 'italic' }}>No jobs found here.</div>
            ) : (
              modalJobs.map((job, idx) => (
                <div key={job._id || idx} style={{
                  border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12,
                  background: '#fafbfc', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#333' }}>{job.title}</h3>
                  <p style={{ marginBottom: '4px' }}><strong>Description:</strong> {job.description}</p>
                  {job.responsibilities && <p style={{ marginBottom: '4px' }}><strong>Responsibilities:</strong> {job.responsibilities}</p>}
                  {job.skills_required && job.skills_required.length > 0 && (
                    <p style={{ marginBottom: '4px' }}>
                      <strong>Skills:</strong> {job.skills_required.map(skill => skill.name).join(', ')}
                    </p>
                  )}
                  <p style={{ marginBottom: '4px' }}><strong>Experience:</strong> {job.experience_required} years</p>
                  <p style={{ marginBottom: '4px' }}><strong>Openings:</strong> {job.number_of_openings - job.openings_hired} / {job.number_of_openings}</p>
                  <p style={{ marginBottom: '4px' }}><strong>Job Type:</strong> {job.job_type}</p>
                  <p style={{ marginBottom: '4px' }}><strong>Wage Type:</strong> {job.wage_type}</p>
                  <p style={{ marginBottom: '4px' }}><strong>Salary:</strong> ₹{job.salary_min} - ₹{job.salary_max} {job.negotiable ? '(Negotiable)' : '(Fixed)'}</p>
                  {job.leaves_allowed && <p style={{ marginBottom: '4px' }}><strong>Leaves Allowed:</strong> {job.leaves_allowed}</p>}
                  <p style={{ marginBottom: '4px' }}><strong>City:</strong> {job.city}</p>
                  <p style={{ marginBottom: '4px' }}><strong>Location:</strong> {job.location && job.location.coordinates ? `${job.location.coordinates[1]}, ${job.location.coordinates[0]}` : 'N/A'}</p>
                  
                  {job.employer_id && (
                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#555' }}>Employer Details</h4>
                      <p><strong>Name:</strong> {job.employer_id.name}</p>
                      <p><strong>Phone:</strong> {job.employer_id.phone_number}</p>
                      {job.employer_id.email && <p><strong>Email:</strong> {job.employer_id.email}</p>}
                      {job.employer_id.employer_profile && (
                        <div style={{ marginTop: '8px' }}>
                          <p><strong>Company:</strong> {job.employer_id.employer_profile.company_name}</p>
                          <p><strong>Company Type:</strong> {job.employer_id.employer_profile.company_type}</p>
                          <p><strong>GSTIN:</strong> {job.employer_id.employer_profile.gstin_number}</p>
                          <p><strong>Verified:</strong> {job.employer_id.employer_profile.is_verified ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JobsHeatmap;
