import { globalEvents } from './EventSystem';
import Patient from '../entities/Patient';
import patientTemplates from '../assets/data/patient_templates.json';
import incidentEvents from '../assets/data/incident_events.json';
import expectedActions from '../assets/data/expected_actions.json';
import scenarios from '../assets/data/scenarios.json';

class StateManager {
  constructor() {
    this.state = {
      phase: 'DISPATCH',
      score: 0,
      timeLeft: 180,
      patients: [],
      vehicles: [],
      tacticalAssets: [], // { id, x, y, type }
      actionChecklist: {},
      skillsCooldown: {}, // { action_id: secondsRemaining }
      emts: [
        { id: 'ALS-1', type: 'ALS', status: 'idle', patientId: null },
        { id: 'ALS-2', type: 'ALS', status: 'idle', patientId: null },
        { id: 'BLS-1', type: 'BLS', status: 'idle', patientId: null },
        { id: 'BLS-2', type: 'BLS', status: 'idle', patientId: null },
        { id: 'BLS-3', type: 'BLS', status: 'idle', patientId: null }
      ],
      currentScenario: scenarios[Math.floor(Math.random() * scenarios.length)]
    };
    this.timerId = null;
    this.vehicleCounter = 1;
  }
  


  applyPenalty(val, reason) {
    this.state.score += val;
    globalEvents.emit('INCIDENT_EVENT', { name: "指揮疏失", description: reason, type: 'PENALTY', value: val });
    this.emitUpdate();
  }
  
  completeSetupPhase(gainedScore, initialAssets = []) {
    this.state.score += gainedScore;
    this.state.tacticalAssets = initialAssets; // { id, x, y }
    globalEvents.emit('INCIDENT_EVENT', { 
        name: "戰術配置完成", 
        description: `您卓越的兵棋配置為後續部隊爭取了極大優勢。獲得調度獎勵：+${gainedScore}`, 
        type: 'BONUS', 
        value: gainedScore 
    });
    this.initResponsePhase(true);
  }

  initResponsePhase(megaphoned = false) {
    this.state.phase = 'COMMAND_CENTER';
    
    // Initial vehicles for transport tab
    this.addVehicle("救護 91 (ALS 車輛)", 1);
    this.addVehicle("民間救護車 (BLS 車輛)", 2);
    for(let i=0; i<6; i++) {
        // Ensure initial diversity by rotating through key templates
        const templateIndex = (i % patientTemplates.length);
        const randTemplate = patientTemplates[templateIndex];
        const p = new Patient(
            i+1, 
            Math.floor(Math.random() * 60) + 20,
            Math.floor(Math.random() * 60) + 20,
            randTemplate
        );
        
        // Feature: Green gathering
        if (megaphoned && p.trueTriageStatus === 'green') {
           p.status = 'green';
           // Place them near bottom right if megaphoned
           p.x = 85 + (Math.random() * 10); 
           p.y = 85 + (Math.random() * 10);
           this.state.score += 50; 
        }
        
        newPatients.push(p);
    }
    this.state.patients = newPatients;
    
    // Start game loop timer
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
        if(this.state.timeLeft > 0) {
            this.state.timeLeft -= 1;
            
            // Check secondary events
            const triggeredEvent = incidentEvents.find(e => e.triggerTimeLeft === this.state.timeLeft);
            if (triggeredEvent) {
                if (triggeredEvent.type === 'PENALTY') {
                    this.state.score += triggeredEvent.value;
                } else if (triggeredEvent.type === 'SPAWN_PATIENTS') {
                    this.spawnPatients(triggeredEvent.value);
                }
                globalEvents.emit('INCIDENT_EVENT', triggeredEvent);
            }

            // Dynamic random spawn increasing over time
            if (this.state.timeLeft % 25 === 0 && this.state.timeLeft <= 160) {
                // The lower the time left, the more patients spawn
                const spawnAmount = Math.floor((180 - this.state.timeLeft) / 30) + 1;
                this.spawnPatients(spawnAmount);
            }

            // Cooldown logic
            Object.keys(this.state.skillsCooldown).forEach(key => {
                if (this.state.skillsCooldown[key] > 0) {
                    this.state.skillsCooldown[key] -= 1;
                }
            });

            this.emitUpdate();
        }
        
        // Treatment & HP Deterioration Logic
        this.state.patients.forEach(p => {
            if (p.hp === undefined) p.hp = 100;
            if (p.hp <= 0) return;

            // 1. Natural Field Deterioration (Untriaged patients lose HP slowly)
            if (p.status === 'unknown') {
                p.hp -= 0.5; // slow but steady decay
            }

            // 2. Mis-triage / Treatment Logic
            if (p.status !== 'unknown' && p.status !== 'black') {
                const treatingEmt = this.state.emts.find(e => e.patientId === p.id);
                
                // Mis-triage penalty: If status is wrong (e.g. under-triaged), decay is faster
                const isMisTriaged = p.status !== p.trueTriageStatus;
                const decayMultiplier = isMisTriaged ? 2 : 1;

                if (treatingEmt) {
                    // Healing (but slower if mis-triaged)
                    const healRate = treatingEmt.type === 'ALS' ? 20 : 8;
                    const finalRate = isMisTriaged ? healRate / 2 : healRate;
                    p.hp = Math.min(100, p.hp + finalRate);
                    
                    if (p.hp === 100) {
                        p.isStabilized = true;
                        treatingEmt.status = 'idle';
                        treatingEmt.patientId = null;
                        this.state.score += 50;
                    }
                } else if (!p.isStabilized) {
                    // Normal/Accelerated Deterioration
                    // FIX: Green patients (Minor) should not naturally deteriorate to death in this simulation
                    const isGreen = p.status === 'green' || p.trueTriageStatus === 'green';
                    if (!isGreen) {
                        const baseDecay = (p.status === 'red' || p.trueTriageStatus === 'red') ? 6 : 2;
                        p.hp -= (baseDecay * decayMultiplier);
                    }
                }
            }

            // 3. Death Logic
            if (p.hp <= 0 && p.status !== 'black') {
                p.hp = 0;
                p.status = 'black';
                this.state.score -= 200;
                globalEvents.emit('INCIDENT_EVENT', { 
                    name: "急診病故", 
                    description: `病患 #${p.id} 因${p.status === 'unknown' ? '延誤檢傷' : '處置不當'}，已失去生命跡象。(-200)`, 
                    type: 'PENALTY', value: -200 
                });
            }
        });

        // Critical End State
        if (this.state.timeLeft === 0 && this.state.phase === 'COMMAND_CENTER') {
            this.state.phase = 'AFTER_ACTION_REPORT';
            clearInterval(this.timerId);
            this.emitUpdate();
        }
    }, 1000);
    this.emitUpdate();
  }
  
  spawnPatients(count) {
    for(let i=0; i<count; i++) {
        const randTemplate = patientTemplates[Math.floor(Math.random() * patientTemplates.length)];
        const newId = this.state.patients.length > 0 ? Math.max(...this.state.patients.map(p => p.id)) + 1 : 1;
        const p = new Patient(
            newId, 
            Math.floor(Math.random() * 70) + 15,
            Math.floor(Math.random() * 70) + 15,
            randTemplate
        );
        this.state.patients.push(p);
    }
  }
  
  processTriage(patientId, selectedColor) {
    const p = this.state.patients.find(x => x.id === patientId);
    if (!p) return;
    
    // 1. Calculate previous correctness (if any)
    const oldStatus = p.status;
    const oldIsCorrect = oldStatus === 'unknown' ? null : (p.trueTriageStatus === oldStatus);
    
    // 2. Update status
    p.status = selectedColor;
    
    // Feature: Auto-move Green Manual Triage to Minor Area
    if (selectedColor === 'green') {
        p.x = 88 + (Math.random() * 8); // Move to safe side
        p.y = 80 + (Math.random() * 15);
    }
    
    // 3. Calculate new correctness
    const newIsCorrect = (p.trueTriageStatus === selectedColor);
    
    // 4. Calculate score correction
    // Case A: First triage
    if (oldIsCorrect === null) {
      if (newIsCorrect) {
        this.state.score += 200; // Buff: 100 -> 200
        globalEvents.emit('TRIAGE_CORRECT', { patient: p });
      } else {
        this.state.score -= 100; // Buff: -50 -> -100 (keep the ratio)
        globalEvents.emit('TRIAGE_INCORRECT', { patient: p });
      }
    } 
    // Case B: Re-triage (Correct -> Incorrect)
    else if (oldIsCorrect && !newIsCorrect) {
      this.state.score -= 300; // Buff: Refund 200 bonus, apply 100 penalty
      globalEvents.emit('TRIAGE_INCORRECT', { patient: p });
    }
    // Case C: Re-triage (Incorrect -> Correct)
    else if (!oldIsCorrect && newIsCorrect) {
      this.state.score += 300; // Buff: Refund 100 penalty, apply 200 bonus
      globalEvents.emit('TRIAGE_CORRECT', { patient: p });
    }
    // Case D: Re-triage (Incorrect -> Incorrect or Correct -> Correct)
    else {
      // Status icon changed but correctness didn't change (e.g. labeling a Red as Yellow when both are wrong)
      // We don't adjust score here but we might want to trigger the toast again for feedback
      if (newIsCorrect) globalEvents.emit('TRIAGE_CORRECT', { patient: p });
      else globalEvents.emit('TRIAGE_INCORRECT', { patient: p });
    }
    
    this.emitUpdate();
  }

  // Removed redundant startTransport

  processActionChecklist(actionId, placementBonus = 0, coords = null) {
    const action = expectedActions.find(a => a.id === actionId);
    if (!action) return;

    if (coords) {
        this.state.tacticalAssets.push({ id: actionId, x: coords.x, y: coords.y, type: actionId });
    }

    if (action.isCooldownAction) {
        if (this.state.skillsCooldown[actionId] > 0) return; // Still cooling down
        this.state.skillsCooldown[actionId] = action.cooldownTime;
        
        if (actionId === 'action_megaphone') {
           let collected = 0;
           // Check if Treatment Area exists
           const treatmentArea = this.state.tacticalAssets.find(a => a.type === 'action_setup_treatment');
           // Default to bottom right if no treatment area
           const targetX = treatmentArea ? treatmentArea.x : 90;
           const targetY = treatmentArea ? treatmentArea.y : 90;

           this.state.patients.forEach(p => {
               if (p.status === 'unknown' && p.trueTriageStatus === 'green') {
                   p.status = 'green';
                   p.x = targetX + (Math.random() * 6 - 3); // Cluster around target
                   p.y = targetY + (Math.random() * 6 - 3);
                   collected++;
               }
           });
           const bonus = collected * action.bonus;
           this.state.score += bonus;
           globalEvents.emit('INCIDENT_EVENT', { 
               name: "輕傷疏散", 
               description: `擴音器廣播成功引導了 ${collected} 名走動患者前往${treatmentArea ? '傷患處置區' : '安全區'}。(+${bonus})`, 
               type: 'BONUS', 
               value: bonus 
           });
           this.emitUpdate();
        }

        // Feature: Request ALS Support Reinforcement
        if (actionId === 'action_request_als') {
           const count = Math.floor(Math.random() * 2) + 1; // 1-2 vehicles
           for(let i=0; i<count; i++) {
               this.addVehicle(`支援 ALS 救護車 (增援-${this.vehicleCounter})`, 1);
           }
           globalEvents.emit('INCIDENT_EVENT', { 
               name: "ALS 增援", 
               description: `正在調派 ${count} 台高級救命術(ALS)車輛趕往現場。`, 
               type: 'BONUS', 
               value: 0 
           });
        }
        return;
    }

    if (this.state.actionChecklist[actionId]) return;

    const [maxT, minT] = action.recommendedTimeWindow;
    const isTimingSuccess = (this.state.timeLeft <= maxT && this.state.timeLeft >= minT);
    
    let earned = 0;
    if (isTimingSuccess) earned += action.bonus;
    else earned += action.penalty;

    earned += placementBonus; // From clicking the map correctly
    
    if (isTimingSuccess || placementBonus > 0) {
       this.state.actionChecklist[actionId] = 'success';
       this.state.score += earned;
       globalEvents.emit('INCIDENT_EVENT', { name: "指揮決策", description: `執行 [ ${action.title} ]. 指揮時效與配區評分獲得: +${earned}`, type: 'BONUS', value: earned });
    } else {
       this.state.actionChecklist[actionId] = 'failed';
       this.state.score += earned;
       globalEvents.emit('INCIDENT_EVENT', { name: "指揮失誤", description: `執行 [ ${action.title} ]. 時機錯過或配位極差: ${earned}`, type: 'PENALTY', value: earned });
    }
    this.emitUpdate();
  }

  addVehicle(name, capacity) {
    // Check if Staging Area exists
    const stagingArea = this.state.tacticalAssets.find(a => a.type === 'action_setup_staging');
    
    // Default position is bottom right if no staging area
    const posX = stagingArea ? stagingArea.x + (Math.random() * 8 - 4) : 95;
    const posY = stagingArea ? stagingArea.y + (Math.random() * 8 - 4) : 95;

    this.state.vehicles.push({
        id: this.vehicleCounter++,
        name,
        capacity,
        loadedPatients: [],
        departed: false,
        x: posX,
        y: posY
    });
  }

  assignPatientToVehicle(patientId, vehicleId) {
    const v = this.state.vehicles.find(veh => veh.id === vehicleId);
    if (!v || v.loadedPatients.length >= v.capacity) return;
    
    // Check if patient is already in another vehicle, if so remove
    this.state.vehicles.forEach(veh => {
        veh.loadedPatients = veh.loadedPatients.filter(id => id !== patientId);
    });
    
    const p = this.state.patients.find(x => x.id === patientId);
    if (p) {
        v.loadedPatients.push(patientId);
        p.assignedVehicleId = vehicleId;
    }
    this.emitUpdate();
  }

  assignEmt(emtId, patientId) {
      const emt = this.state.emts.find(e => e.id === emtId);
      const patient = this.state.patients.find(p => p.id === patientId);
      if (emt && emt.status === 'idle' && patient && !patient.isStabilized && patient.hp > 0 && patient.status !== 'black') {
          emt.status = 'busy';
          emt.patientId = patientId;
          this.emitUpdate();
      }
  }

  unassignEmt(emtId) {
      const emt = this.state.emts.find(e => e.id === emtId);
      if (emt && emt.status === 'busy') {
          emt.status = 'idle';
          emt.patientId = null;
          this.emitUpdate();
      }
  }

  dispatchVehicle(vehicleId) {
    const v = this.state.vehicles.find(veh => veh.id === vehicleId);
    if (!v || v.loadedPatients.length === 0) return;
    
    v.departed = true;
    
    let vehicleScore = 0;
    v.loadedPatients.forEach(pid => {
        const p = this.state.patients.find(x => x.id === pid);
        if (p) {
            if (p.status === 'red') vehicleScore += 500; // Buff: 200 -> 500
            if (p.status === 'yellow') vehicleScore += 300; // Buff: 100 -> 300
            if (p.status === 'green') vehicleScore += 150; // Buff: 50 -> 150
            if (p.status === 'black') vehicleScore -= 800; // Penalty Buff: -500 -> -800
            
            // Mark as transported so they disappear from UI (but now styled as hollow on map)
            p.transported = true;
        }
    });

    this.state.score += vehicleScore;
    globalEvents.emit('INCIDENT_EVENT', { 
        name: "車輛發車", 
        description: `成功後送 ${v.loadedPatients.length} 名傷患。交通調度貢獻: ${vehicleScore}`, 
        type: vehicleScore < 0 ? 'PENALTY' : 'BONUS', 
        value: vehicleScore 
    });
    
    // Auto-generate new vehicles
    setTimeout(() => {
        if(this.state.phase === 'COMMAND_CENTER' && this.state.timeLeft > 0) {
            this.addVehicle(`支援救護車 #${Math.floor(Math.random()*100)}`, Math.random() > 0.5 ? 2 : 1);
            this.emitUpdate();
        }
    }, 5000);

    this.emitUpdate();
  }

  emitUpdate() {
    globalEvents.emit('STATE_UPDATE', { ...this.state, patients: [...this.state.patients] });
  }
  
  getState() {
      return this.state;
  }
}

export const gameState = new StateManager();
