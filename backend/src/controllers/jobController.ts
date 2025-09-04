import { Request, Response } from 'express';
import Job from '../models/Job';
import Container from '../models/Container';
import { getVehicles, getVehiclesWithPositions, getVehicleTimelineEvents } from './vehicleController';
import { getAllDrivers } from './driverController';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';

// Helper to call existing route handlers (req,res) and capture their JSON response
const captureJson = (handler: any, reqMock: any = {}): Promise<any> => {
  return new Promise((resolve) => {
    const fakeReq: any = {
      params: reqMock.params || {},
      query: reqMock.query || {},
      body: reqMock.body || {},
    };
    const fakeRes: any = {
      json: (data: any) => resolve(data),
      status: (s: number) => ({ json: (d: any) => resolve(d) }),
    };
    // call handler (it may be async)
    try {
      const maybePromise = handler(fakeReq as any, fakeRes as any);
      if (maybePromise && typeof maybePromise.then === 'function') {
        // handler returns a promise; let it run — it should call fakeRes.json eventually
        maybePromise.catch((e: any) => {
          console.error('captureJson handler error:', e);
          resolve(null);
        });
      }
    } catch (err) {
      console.error('captureJson sync error:', err);
      resolve(null);
    }
  });
};

// Create Job
export const createJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { jobId, driverName, vehicleRegistration, vehicleRegistrationBack, containerNumber, remark } = req.body;

    // normalize inputs
    const driverNameNorm = driverName?.toString().trim();
    const vehicleRegistrationNorm = vehicleRegistration?.toString().trim().toUpperCase().replace(/\s+/g, '') ;
    const containerNumberNorm = containerNumber?.toString().trim() || undefined;
    const remarkNorm = remark?.toString().trim() || undefined;

  // always generate jobId on server (do not accept jobId from frontend)
  const finalJobId = `JOB-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    if (!driverNameNorm || !vehicleRegistrationNorm) {
      res.status(400).json({ message: 'driverName and vehicleRegistration are required' });
      return;
    }

    // validate container exists when provided
    if (containerNumberNorm) {
      const containerExists = await Container.findOne({ containerNumber: containerNumberNorm });
      if (!containerExists) {
        res.status(400).json({ message: 'containerNumber not found' });
        return;
      }
    }

  // validate vehicle via existing external handlers
  // call getVehicles to retrieve fleet, then get positions and match by registration
  const vehiclesList: any[] = await captureJson(getVehicles, {});
    let vehicleInfo: any = null;
    if (Array.isArray(vehiclesList)) {
      const found = vehiclesList.find((v: any) => {
        try {
          const combined = Object.values(v).filter((x: any) => typeof x === 'string').join(' ').toUpperCase().replace(/\s+/g, '');
          return combined.includes(vehicleRegistrationNorm);
        } catch (e) {
          return false;
        }
      });
      if (found) {
        const positions = await captureJson(getVehiclesWithPositions, {});
        const pos = Array.isArray(positions) ? positions.find((p: any) => p.vehicle_id === found.vehicle_id) : null;
        vehicleInfo = { vehicle: found, position: pos || null };
      }
    }
    if (!vehicleInfo) {
      res.status(400).json({ message: 'vehicleRegistration not found via external API' });
      return;
    }

  // validate driver via external API (best-effort)
  // get all drivers and try to match by name or id
  const driversList: any[] = await captureJson(getAllDrivers, {});
    const driverInfo = Array.isArray(driversList)
      ? driversList.find((d: any) => {
          const n = (d.name || d.driver_name || d.driverId || d.driver_id || '').toString().toUpperCase();
          return n.includes(driverNameNorm.toUpperCase()) || (d.driver_id && d.driver_id.toString() === driverNameNorm);
        })
      : null;
    if (!driverInfo) {
      console.warn('Driver not found in external API, saving job anyway');
    }

    const newJob = new Job({
      jobId: finalJobId,
      driverName: driverNameNorm,
      vehicleRegistration: vehicleRegistrationNorm,
      vehicleRegistrationBack: vehicleRegistrationBack?.toString().trim() || undefined,
      containerNumber: containerNumberNorm,
      remark: remarkNorm,
      createdBy: userId,
    });

  await newJob.save();

  const responseObj: any = { job: newJob };
  responseObj.vehicle = vehicleInfo;
  if (driverInfo) responseObj.driver = driverInfo;

  res.status(201).json({ message: 'Job created', data: responseObj });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
};

// Read all jobs
export const getAllJobs = async (_req: Request, res: Response): Promise<void> => {
  try {
  const jobs = await Job.find();
    // attach container info if available
    const jobsWithContainer = await Promise.all(
      jobs.map(async (j) => {
        const obj = j.toObject();
        if (obj.containerNumber) {
          const c = await Container.findOne({ containerNumber: obj.containerNumber });
          // attach minimal container info
          (obj as any).container = c ? { id: c._id, containerNumber: c.containerNumber, companyName: c.companyName } : null;
        }
        return obj;
      })
    );
    // attach vehicle & driver info for each job
    const jobsEnriched = await Promise.all(
      jobsWithContainer.map(async (obj) => {
        if (obj.vehicleRegistration) {
          // enrich using existing handlers
          const vehiclesListLocal: any[] = await captureJson(getVehicles, {});
          if (Array.isArray(vehiclesListLocal)) {
            const foundLocal = vehiclesListLocal.find((v: any) => {
              try {
                const combined = Object.values(v).filter((x: any) => typeof x === 'string').join(' ').toUpperCase().replace(/\s+/g, '');
                return combined.includes(obj.vehicleRegistration.toString().toUpperCase().replace(/\s+/g, ''));
              } catch (e) {
                return false;
              }
            });
            if (foundLocal) {
              const positionsLocal = await captureJson(getVehiclesWithPositions, {});
              const posLocal = Array.isArray(positionsLocal) ? positionsLocal.find((p: any) => p.vehicle_id === foundLocal.vehicle_id) : null;
              // also fetch timeline events for today
              const today = new Date().toISOString().slice(0,10);
              const timeline = await captureJson(getVehicleTimelineEvents, { params: { vehicle_id: foundLocal.vehicle_id }, query: { date: today } });
              (obj as any).vehicle = { vehicle: foundLocal, position: posLocal || null, timeline: timeline || null };
            }
          }
        }
        if (obj.driverName) {
          const driversListObj: any[] = await captureJson(getAllDrivers, {});
          const d = Array.isArray(driversListObj) ? driversListObj.find((dr: any) => ((dr.name || dr.driver_name || '').toString().toUpperCase().includes(obj.driverName.toString().toUpperCase()) || (dr._id && dr._id.toString() === obj.driverName.toString()))) : null;
          if (d) (obj as any).driver = d;
        }
        return obj;
      })
    );

    res.status(200).json({ success: true, data: jobsEnriched });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

// Read single job by id (mongo _id)
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
  const obj = job.toObject();
    if (obj.containerNumber) {
      const c = await Container.findOne({ containerNumber: obj.containerNumber });
      (obj as any).container = c ? { id: c._id, containerNumber: c.containerNumber, companyName: c.companyName } : null;
    }
  // attach vehicle & driver info from API
  if (obj.vehicleRegistration) {
    const vehiclesListObj: any[] = await captureJson(getVehicles, {});
    if (Array.isArray(vehiclesListObj)) {
      const foundObj = vehiclesListObj.find((v: any) => Object.values(v).filter((x: any) => typeof x === 'string').join(' ').toUpperCase().replace(/\s+/g, '').includes(obj.vehicleRegistration.toString().toUpperCase().replace(/\s+/g, '')));
      if (foundObj) {
        const positionsObj = await captureJson(getVehiclesWithPositions, {});
        const posObj = Array.isArray(positionsObj) ? positionsObj.find((p: any) => p.vehicle_id === foundObj.vehicle_id) : null;
        const today = new Date().toISOString().slice(0,10);
        const timelineObj = await captureJson(getVehicleTimelineEvents, { params: { vehicle_id: foundObj.vehicle_id }, query: { date: today } });
        (obj as any).vehicle = { vehicle: foundObj, position: posObj || null, timeline: timelineObj || null };
      }
    }
  }
  if (obj.driverName) {
    const driversListObj: any[] = await captureJson(getAllDrivers, {});
    const dObj = Array.isArray(driversListObj) ? driversListObj.find((d: any) => ((d.name || d.driver_name || '').toString().toUpperCase().includes(obj.driverName.toString().toUpperCase()) || (d._id && d._id.toString() === obj.driverName.toString()))) : null;
    if (dObj) (obj as any).driver = dObj;
  }

  res.status(200).json(obj);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
};

// Update job
export const updateJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // normalize updates
    if (updates.driverName) updates.driverName = updates.driverName.toString().trim();
    if (updates.vehicleRegistration) updates.vehicleRegistration = updates.vehicleRegistration.toString().trim().toUpperCase().replace(/\s+/g, '');
    if (updates.containerNumber) updates.containerNumber = updates.containerNumber.toString().trim();

    // if containerNumber provided, validate
    if (updates.containerNumber) {
      const containerExists = await Container.findOne({ containerNumber: updates.containerNumber.toString().trim() });
      if (!containerExists) {
        res.status(400).json({ message: 'containerNumber not found' });
        return;
      }
    }

    // validate vehicle if provided
    if (updates.vehicleRegistration) {
  // validate by retrieving fleet and positions via existing handlers
  const vehiclesListUpd: any[] = await captureJson(getVehicles, {});
      let foundUpd = null;
      if (Array.isArray(vehiclesListUpd)) {
        foundUpd = vehiclesListUpd.find((v: any) => Object.values(v).filter((x: any) => typeof x === 'string').join(' ').toUpperCase().replace(/\s+/g, '').includes(updates.vehicleRegistration.toString().toUpperCase().replace(/\s+/g, '')));
      }
      if (!foundUpd) {
        res.status(400).json({ message: 'vehicleRegistration not found via external API' });
        return;
      }
    }

    // validate driver if provided (best-effort)
    if (updates.driverName) {
  const driversUpd: any[] = await captureJson(getAllDrivers, {});
  const driverInfo = Array.isArray(driversUpd) ? driversUpd.find((d: any) => ((d.name || d.driver_name || '').toString().toUpperCase().includes(updates.driverName.toString().toUpperCase()) || (d.driver_id && d.driver_id.toString() === updates.driverName.toString()))) : null;
  if (!driverInfo) console.warn('Driver not found in external API during update');
    }

  // prevent jobId being updated by client
  if (updates.jobId) delete updates.jobId;

  const updated = await Job.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const obj = updated.toObject();
  if (obj.containerNumber) {
      const c = await Container.findOne({ containerNumber: obj.containerNumber });
      (obj as any).container = c ? { id: c._id, containerNumber: c.containerNumber, companyName: c.companyName } : null;
    }

  // attach vehicle & driver info
  // attach vehicle & driver info using existing handlers
  if (obj.vehicleRegistration) {
    const vehiclesListFinal: any[] = await captureJson(getVehicles, {});
    if (Array.isArray(vehiclesListFinal)) {
      const foundFinal = vehiclesListFinal.find((v: any) => Object.values(v).filter((x: any) => typeof x === 'string').join(' ').toUpperCase().replace(/\s+/g, '').includes(obj.vehicleRegistration.toString().toUpperCase().replace(/\s+/g, '')));
      if (foundFinal) {
        const positionsFinal = await captureJson(getVehiclesWithPositions, {});
        const posFinal = Array.isArray(positionsFinal) ? positionsFinal.find((p: any) => p.vehicle_id === foundFinal.vehicle_id) : null;
        const today = new Date().toISOString().slice(0,10);
        const timelineFinal = await captureJson(getVehicleTimelineEvents, { params: { vehicle_id: foundFinal.vehicle_id }, query: { date: today } });
        (obj as any).vehicle = { vehicle: foundFinal, position: posFinal || null, timeline: timelineFinal || null };
      }
    }
  }
  if (obj.driverName) {
    const driversFinal: any[] = await captureJson(getAllDrivers, {});
    const dInfo = Array.isArray(driversFinal) ? driversFinal.find((d: any) => ((d.name || d.driver_name || '').toString().toUpperCase().includes(obj.driverName.toString().toUpperCase()) || (d._id && d._id.toString() === obj.driverName.toString()))) : null;
    if (dInfo) (obj as any).driver = dInfo;
  }

  res.status(200).json({ message: 'Job updated', data: obj });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
};

// Receive vehicle status payload from frontend and update matching Job(s)
export const receiveJobStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const registrationRaw = payload?.registration || payload?.reg || payload?.vehicleRegistration;
    if (!registrationRaw) {
      res.status(400).json({ message: 'registration is required in payload' });
      return;
    }
    const registration = registrationRaw.toString().trim().toUpperCase().replace(/\s+/g, '');

    const mapStatus = payload?.mapStatus || null;
    const statusSummary = mapStatus && mapStatus.summary ? mapStatus.summary : (typeof mapStatus === 'string' ? mapStatus : JSON.stringify(mapStatus || {}));

    // find jobs that use this vehicleRegistration
    const jobs = await Job.find({ vehicleRegistration: registration });
    if (!jobs || jobs.length === 0) {
      res.status(404).json({ message: 'No jobs found for registration', registration });
      return;
    }

    const updated = await Promise.all(jobs.map(async (j) => {
      j.status = statusSummary;
      return await j.save();
    }));

    res.status(200).json({ message: 'Job status updated', registration, count: updated.length, updated });
  } catch (error) {
    console.error('Error receiving job status:', error);
    res.status(500).json({ message: 'Failed to update job status' });
  }
};

// Delete job
export const deleteJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Job.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.status(200).json({ message: 'Job deleted' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
};

// Helper: get jobs by vehicleRegistration
export const getJobsByVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleRegistration } = req.params;
    const jobs = await Job.find({ vehicleRegistration });
    const jobsWithContainer = await Promise.all(
      jobs.map(async (j) => {
        const obj = j.toObject();
        if (obj.containerNumber) {
          const c = await Container.findOne({ containerNumber: obj.containerNumber });
          (obj as any).container = c ? { id: c._id, containerNumber: c.containerNumber, companyName: c.companyName } : null;
        }
        return obj;
      })
    );
    res.status(200).json({ success: true, data: jobsWithContainer });
  } catch (error) {
    console.error('Error fetching jobs by vehicle:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};
