export default class Patient {
  constructor(id, x, y, template) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.templateName = template.name;
    
    // Support either 'crt' (new) or 'pulse' (old) from template
    const crtRange = template.vitals.crt || [0.8, 1.8];
    const respRange = template.vitals.respiration || [12, 20];
    
    // Generate random vitals
    this.vitals = {
      resp: this._randomRange(respRange[0], respRange[1]),
      // CRT is a decimal value representing seconds
      crt: this._randomDecimal(crtRange[0], crtRange[1]),
      mentalRaw: template.vitals.mental[Math.floor(Math.random() * template.vitals.mental.length)]
    };
    
    // Trauma symptom logic: if CRT > 2.0, assign a massive bleed or torso injury
    this.vitals.traumaSymptom = null;
    if (this.vitals.crt > 2.0) {
      const symptoms = ['發現大量出血', '發現軀幹穿刺傷'];
      this.vitals.traumaSymptom = symptoms[Math.floor(Math.random() * symptoms.length)];
    }

    // UI string for mental status
    this.vitals.mental = template.mental_descriptions[this.vitals.mentalRaw];
    
    this.status = 'unknown'; 
    this.trueTriageStatus = this._calculateTrueStatus();
  }

  _randomRange(min, max) {
    if (min === max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _randomDecimal(min, max) {
    if (min === max) return min;
    return parseFloat((Math.random() * (max - min) + min).toFixed(1));
  }

  _calculateTrueStatus() {
    const { resp, crt, mentalRaw } = this.vitals;
    
    // 1. Walk check (handled by template/manager usually, but here for ground truth)
    if (mentalRaw === 'obedient_walking') return 'green';

    // 2. Respiration
    if (resp === 0) return 'black';
    if (resp > 30) return 'red';
    
    // 3. Perfusion (CRT)
    if (crt > 2.0 || crt === 0) return 'red';
    
    // 4. Mental Status
    if (mentalRaw === 'unconscious' || mentalRaw === 'confused_immobile') return 'red';
    if (mentalRaw === 'obedient_immobile') return 'yellow';
    
    return 'red'; 
  }
}
