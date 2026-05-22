import { isMixedWeedPlaceholder, canonicalizeWeedSpecies, normalizeLifecycleSafeStatus } from './weedUtils.js';
import { safeJsonParse, extractMetricValue } from './helpers.js';
import { computeObservationTotalCover } from './coverUtils.js';

export function validateEfficacyData (efficacy) {
                if (!Array.isArray(efficacy)) {
                    console.warn('EfficacyDataJSON is not an array');
                    return [];
                }

                const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
                const toNum = (v) => {
                    if (v === null || v === undefined) return null;
                    const n = typeof v === 'number' ? v : parseFloat(v);
                    return isFinite(n) ? n : null;
                };
                const deriveTotalCoverFromDetails = (details) => {
                    if (!Array.isArray(details) || details.length === 0) return null;
                    const covers = details
                        .filter(w => {
                            const species = String(w?.species || w?.name || w?.weed || w?.weedSpecies || '').trim();
                            if (!species) return false;
                            if (species.toLowerCase() === 'total') return false;
                            if (isMixedWeedPlaceholder && isMixedWeedPlaceholder(species)) return false;
                            return true;
                        })
                        .map(w => toNum(w?.cover))
                        .filter(v => v !== null)
                        .map(v => clamp(v, 0, 100));
                    if (!covers.length) return null;
                    const additive = covers.reduce((s, v) => s + v, 0);
                    if (additive <= 100) return clamp(additive, 0, 100);
                    const unionProb = 1 - covers.reduce((p, v) => p * (1 - (v / 100)), 1);
                    return clamp(unionProb * 100, 0, 100);
                };
                const isRegrowthSignal = (text) => /re-emerg|regrowth|re-grow|resistant/i.test(String(text || ''));
                const addWarning = (obs, message) => {
                    const current = String(obs.validationNotes || '').trim();
                    if (!current) {
                        obs.validationNotes = message;
                        return;
                    }
                    const existing = current.split(/\s*;\s*/).map(v => v.trim().toLowerCase()).filter(Boolean);
                    if (existing.includes(String(message || '').trim().toLowerCase())) return;
                    obs.validationNotes = `${current}; ${message}`;
                };

                const normalized = [];

                efficacy.forEach(rawObs => {
                    if (!rawObs || typeof rawObs !== 'object') return;

                    const obs = { ...rawObs };
                    const daa = toNum(obs.daa);
                    if (daa === null || daa < 0) return;
                    obs.daa = daa;

                    if (obs.phyto !== undefined) delete obs.phyto;
                    if (obs.phi !== undefined) delete obs.phi;

                    if (obs.controlPct !== undefined && obs.controlPct !== null && obs.controlPct !== '') {
                        const cp = toNum(obs.controlPct);
                        if (cp === null) delete obs.controlPct;
                        else obs.controlPct = clamp(cp, 0, 100);
                    } else if (obs.control !== undefined && obs.control !== null && obs.control !== '') {
                        const cp = toNum(obs.control);
                        if (cp !== null) obs.controlPct = clamp(cp, 0, 100);
                    }

                    if (obs.isBaseline !== undefined && obs.isBaseline !== null && obs.isBaseline !== '') {
                        obs.isBaseline = String(obs.isBaseline).toLowerCase() === 'true';
                    }

                    if (typeof obs.weedDetails === 'string') {
                        try {
                            const parsed = JSON.parse(obs.weedDetails);
                            obs.weedDetails = parsed;
                        } catch (e) { }
                    }

                    if (Array.isArray(obs.weedDetails)) {
                        const cleaned = [];
                        obs.weedDetails.forEach(w => {
                            if (!w || typeof w !== 'object') return;
                            const species = String(w.species || w.name || w.weed || w.weedSpecies || w.label || '').trim();
                            const coverRaw = (w.cover !== undefined) ? w.cover : (w.coverPct !== undefined ? w.coverPct : (w.percentCover !== undefined ? w.percentCover : (w.weedCover !== undefined ? w.weedCover : undefined)));
                            const coverNum = toNum(coverRaw);
                            const cover = coverNum === null ? null : clamp(coverNum, 0, 100);
                            const status = String(w.status || w.Status || w.weedStatus || '').trim();
                            const notes = String(w.notes || w.note || '').trim();
                            if (!species && cover === null && !status && !notes) return;
                            cleaned.push({ ...w, species: canonicalizeWeedSpecies(species || 'Unknown'), cover, status, notes });
                        });
                        obs.weedDetails = cleaned;
                    }

                    if (!obs.weedDetails || obs.weedDetails.length === 0) {
                        const legacyCoverCandidates = [
                            obs.cover,
                            obs.weedCover,
                            obs.weed_cover,
                            obs.coverPct,
                            obs.percentCover,
                            obs.totalCover,
                            obs.weedCoverTotal
                        ];
                        const firstFound = legacyCoverCandidates.find(v => v !== undefined && v !== null && v !== '');
                        const c = toNum(firstFound);
                        if (c !== null) {
                            const status = String(obs.weedStatus || obs.status || '').trim();
                            const notes = String(obs.notes || '').trim();
                            obs.weedDetails = [{ species: 'Total', cover: clamp(c, 0, 100), status, notes }];
                        }
                    }

                    if (obs.weedCover !== undefined && obs.weedCover !== null && obs.weedCover !== '') {
                        const wc = toNum(obs.weedCover);
                        if (wc === null) {
                            delete obs.weedCover;
                        } else {
                            obs.weedCover = clamp(wc, 0, 100);
                        }
                    }

                    if ((obs.weedCover === undefined || obs.weedCover === null || obs.weedCover === '') && Array.isArray(obs.weedDetails) && obs.weedDetails.length > 0) {
                        const derivedCover = deriveTotalCoverFromDetails(obs.weedDetails);
                        if (derivedCover !== null && derivedCover !== undefined) {
                            obs.weedCover = derivedCover;
                            if (!obs.weedCoverMode) obs.weedCoverMode = 'auto';
                        }
                    }

                    normalized.push(obs);
                });

                // Cross-observation integrity: normalize duplicates, enforce early temporal consistency,
                // and keep observation total cover aligned with species covers.
                const ordered = normalized.slice().sort((a, b) => (parseFloat(a.daa) || 0) - (parseFloat(b.daa) || 0));
                const lastSeenBySpecies = new Map();

                // Global DAA 0 authority across duplicate baseline observations.
                let daa0BestRealSpeciesSum = 0;
                ordered.forEach(obs => {
                    if ((parseFloat(obs?.daa) || 0) !== 0) return;
                    const realSum = (Array.isArray(obs?.weedDetails) ? obs.weedDetails : []).reduce((sum, w) => {
                        const sp = String(w?.species || '').trim().toLowerCase();
                        if (!sp || sp === 'total') return sum;
                        if (isMixedWeedPlaceholder && isMixedWeedPlaceholder(sp)) return sum;
                        return sum + (toNum(w?.cover) || 0);
                    }, 0);
                    if (realSum > daa0BestRealSpeciesSum) daa0BestRealSpeciesSum = realSum;
                });
                daa0BestRealSpeciesSum = clamp(daa0BestRealSpeciesSum, 0, 100);

                ordered.forEach(obs => {
                    if (!Array.isArray(obs.weedDetails) || obs.weedDetails.length === 0) return;

                    const merged = new Map();
                    obs.weedDetails.forEach(w => {
                        const key = canonicalizeWeedSpecies(w.species || 'Unknown');
                        const cover = toNum(w.cover);
                        const current = merged.get(key);
                        if (!current) {
                            merged.set(key, { ...w, species: key, cover });
                            return;
                        }
                        const currentCover = toNum(current.cover);
                        const nextCover = cover;
                        if (nextCover !== null && (currentCover === null || nextCover > currentCover)) {
                            current.cover = nextCover;
                                if (w.status) current.status = w.status;
                                if (w.notes) current.notes = w.notes;
                        }
                        // When covers are equal: prefer the real (non-autoInjected) entry's
                        // properties so original AI observation notes are not lost.
                        if (!w.autoInjected && current.autoInjected) {
                            current.autoInjected = false;
                            const wNotes = String(w.notes || '');
                            const isAutoNote = /^(auto-repaired:|auto-added:|auto-tracking:)/i.test(wNotes);
                            if (!isAutoNote && wNotes.trim()) current.notes = wNotes;
                        }
                        if (!current.status && w.status) current.status = w.status;
                        if (!current.notes && w.notes) current.notes = w.notes;
                    });

                    obs.weedDetails = Array.from(merged.values()).map(w => ({
                        ...w,
                        cover: w.cover === null ? null : clamp(w.cover, 0, 100)
                    }));

                    const isBaselineObs = (parseFloat(obs.daa) || 0) === 0;
                    if (!isBaselineObs) {
                        obs.weedDetails = obs.weedDetails.filter(w => !isMixedWeedPlaceholder(String(w.species || '')));
                    } else {
                        const hasRealBaselineSpecies = obs.weedDetails.some(w => {
                            const species = String(w.species || '').trim();
                            if (!species || species.toLowerCase() === 'total') return false;
                            if (isMixedWeedPlaceholder && isMixedWeedPlaceholder(species)) return false;
                            return (toNum(w.cover) || 0) > 0.1;
                        });
                        if (hasRealBaselineSpecies) {
                            obs.weedDetails = obs.weedDetails.filter(w => !isMixedWeedPlaceholder(String(w.species || '')));
                        } else {
                            const mixedRows = obs.weedDetails.filter(w => isMixedWeedPlaceholder(String(w.species || '')));
                            if (mixedRows.length > 1) {
                                let kept = false;
                                obs.weedDetails = obs.weedDetails.filter(w => {
                                    if (!isMixedWeedPlaceholder(String(w.species || ''))) return true;
                                    if (kept) return false;
                                    kept = true;
                                    return true;
                                });
                            }
                        }
                    }

                    obs.weedDetails.forEach(w => {
                        if (w.cover === null || w.species === 'Total') return;
                        const prev = lastSeenBySpecies.get(w.species);
                        // DAA 0 = baseline (before spray) - never zero its cover.
                        // Early-window spike suppression only applies to DAA 1-3.
                        const daaVal = parseFloat(obs.daa) || 0;
                        const earlyWindow = daaVal > 0 && daaVal <= 3;
                            const combinedSignals = `${w.status || ''} ${w.notes || ''} ${obs.notes || ''}`;
                            const allowIncrease = isRegrowthSignal(combinedSignals) || /\[cover corrected:|redistributed from total/i.test(combinedSignals);

                        if (!prev && earlyWindow && w.cover > 3 && !allowIncrease) {
                            w.cover = 0;
                            addWarning(obs, `${w.species}: removed early new-appearance spike at DAA ${obs.daa}.`);
                        } else if (prev && earlyWindow && w.cover > (prev.cover + 5) && !allowIncrease) {
                            w.cover = prev.cover;
                            addWarning(obs, `${w.species}: capped unrealistic DAA ${obs.daa} increase to previous cover.`);
                        }

                        // DAA 0 baseline integrity: if total>0 but species are all 0, restore or synthesize baseline.
                        const isBaselineDaa = (parseFloat(obs.daa) || 0) === 0;
                        if (isBaselineDaa) {
                            const speciesRows = (obs.weedDetails || []).filter(x => {
                                const s = String(x.species || '').trim().toLowerCase();
                                return s && s !== 'total';
                            });
                            const baselineTotal = Math.max(
                                toNum(obs.weedCover) || 0,
                                ...(obs.weedDetails || [])
                                    .filter(x => String(x.species || '').trim().toLowerCase() === 'total')
                                    .map(x => toNum(x.cover) || 0)
                            );
                            let speciesSum = speciesRows.reduce((s, x) => s + (toNum(x.cover) || 0), 0);

                            if (baselineTotal > 0 && speciesSum <= 0.1) {
                                // a) Restore baseline from parsed "Cover corrected" note, when available.
                                speciesRows.forEach(x => {
                                    const c = toNum(x.cover) || 0;
                                    if (c > 0) return;
                                    const m = String(x.notes || '').match(/Cover\s*corrected:\s*(\d+(?:\.\d+)?)%/i);
                                    if (!m) return;
                                    const corrected = clamp(toNum(m[1]) || 0, 0, 100);
                                    if (corrected > 0) x.cover = corrected;
                                });
                                speciesSum = speciesRows.reduce((s, x) => s + (toNum(x.cover) || 0), 0);

                                // b) Prefer dominant species only when explicitly supported by notes;
                                // otherwise use neutral mixed placeholder baseline.
                                if (speciesSum <= 0.1) {
                                    const dominantRx = /across most of the plot|most of the plot|across the plot|throughout the plot|dominant|extensive|dense|thick|mat|carpet|abundant|widespread|majority|grassy vegetation|grass/i;
                                    const targetCover = Math.round(clamp(baselineTotal, 0, 100) * 10) / 10;
                                    const preferred = speciesRows.find(x => dominantRx.test(String(x.notes || '')));
                                    if (preferred) {
                                        preferred.cover = targetCover;
                                        preferred.status = 'Unaffected';
                                        preferred.notes = window.upsertCoverCorrectionNote(preferred.notes, `${targetCover}% redistributed from total ${targetCover}% baseline`);
                                    } else {
                                        const mixed = (obs.weedDetails || []).find(x => isMixedWeedPlaceholder(String(x.species || '')));
                                        if (mixed) {
                                            mixed.cover = targetCover;
                                            mixed.status = 'Baseline reference';
                                            mixed.notes = 'Auto-baseline: mixed weed baseline synthesized from DAA 0 total cover.';
                                        } else {
                                            obs.weedDetails.push({
                                                species: 'Mixed weed population',
                                                cover: targetCover,
                                                status: 'Baseline reference',
                                                notes: 'Auto-baseline: mixed weed baseline synthesized from DAA 0 total cover.'
                                            });
                                        }
                                    }
                                }
                            }
                        }

                        const prevCover = prev ? prev.cover : null;
                        w.status = normalizeLifecycleSafeStatus(w.species, w.status, `${w.notes || ''} ${obs.notes || ''}`, prevCover, w.cover);

                        // DAA 0 cannot have post-treatment injury statuses.
                        if ((parseFloat(obs.daa) || 0) === 0) {
                            if (isMixedWeedPlaceholder && isMixedWeedPlaceholder(String(w.species || ''))) {
                                w.status = 'Baseline reference';
                            } else {
                                w.status = (toNum(w.cover) || 0) > 0.1 ? 'Unaffected' : 'Not detected';
                            }
                        }

                        lastSeenBySpecies.set(w.species, {
                            cover: toNum(w.cover) === null ? 0 : clamp(toNum(w.cover), 0, 100),
                            daa: parseFloat(obs.daa) || 0
                        });
                    });

                    const derivedCover = deriveTotalCoverFromDetails(obs.weedDetails);
                    if (derivedCover !== null && derivedCover !== undefined) {
                        const daaVal = parseFloat(obs.daa) || 0;
                        const realSpeciesSum = (obs.weedDetails || []).reduce((sum, w) => {
                            const sp = String(w?.species || '').trim();
                            if (!sp || sp.toLowerCase() === 'total') return sum;
                            if (isMixedWeedPlaceholder && isMixedWeedPlaceholder(sp)) return sum;
                            return sum + (toNum(w?.cover) || 0);
                        }, 0);
                        const existing = toNum(obs.weedCover);
                        let correctedCover = derivedCover;
                        if (daaVal === 0 && realSpeciesSum > 0.1) {
                            correctedCover = clamp(realSpeciesSum, 0, 100);
                        } else if (existing !== null && existing > 0 && realSpeciesSum <= 0.1) {
                            // Do not collapse valid observed total cover to zero when species rows are incomplete.
                            correctedCover = clamp(existing, 0, 100);
                        }
                        if (existing === null || Math.abs(existing - correctedCover) > 0.1 || daaVal === 0) {
                            obs.weedCover = correctedCover;
                            obs.weedCoverMode = 'reconciled';
                        }

                        // Keep Total detail in sync with reconciled observation total.
                        if (Array.isArray(obs.weedDetails)) {
                            const totalRows = obs.weedDetails.filter(w => String(w?.species || '').trim().toLowerCase() === 'total');
                            totalRows.forEach(t => { t.cover = obs.weedCover; });

                            // Strict DAA 0 mixed-placeholder rule:
                            // if real species are present, mixed placeholder must not carry non-zero cover.
                            if (daaVal === 0) {
                                const hasRealPositive = obs.weedDetails.some(w => {
                                    const sp = String(w?.species || '').trim();
                                    if (!sp || sp.toLowerCase() === 'total') return false;
                                    if (isMixedWeedPlaceholder && isMixedWeedPlaceholder(sp)) return false;
                                    return (toNum(w?.cover) || 0) > 0.1;
                                });

                                if (hasRealPositive) {
                                    obs.weedDetails = obs.weedDetails.filter(w => !isMixedWeedPlaceholder(String(w?.species || '')));
                                } else {
                                    let keptMixed = false;
                                    obs.weedDetails = obs.weedDetails.filter(w => {
                                        const isMixed = isMixedWeedPlaceholder(String(w?.species || ''));
                                        if (!isMixed) return true;
                                        if (keptMixed) return false;
                                        keptMixed = true;
                                        return true;
                                    }).map(w => {
                                        if (!isMixedWeedPlaceholder(String(w?.species || ''))) return w;
                                        return {
                                            ...w,
                                            cover: clamp(toNum(obs.weedCover) || 0, 0, 100),
                                            status: 'Baseline reference'
                                        };
                                    });
                                }
                            }
                        }
                    }

                    // Final authoritative DAA 0 reconciliation (last writer wins):
                    // if real species exist, baseline/total must equal their sum and mixed placeholder is removed.
                    if ((parseFloat(obs.daa) || 0) === 0 && Array.isArray(obs.weedDetails)) {
                        const realSpeciesRows = obs.weedDetails.filter(w => {
                            const sp = String(w?.species || '').trim().toLowerCase();
                            return sp && sp !== 'total' && !(isMixedWeedPlaceholder && isMixedWeedPlaceholder(sp));
                        });
                        const realSpeciesSum = clamp(realSpeciesRows.reduce((sum, w) => sum + (toNum(w?.cover) || 0), 0), 0, 100);
                        const authoritativeDaa0Sum = daa0BestRealSpeciesSum > 0.1 ? daa0BestRealSpeciesSum : realSpeciesSum;

                        // DAA 0 is pre-spray by definition.
                        obs.controlPct = 0;
                        if (obs.control !== undefined) obs.control = 0;
                        obs.isBaseline = true;

                        if (authoritativeDaa0Sum > 0.1) {
                            obs.weedCover = authoritativeDaa0Sum;
                            obs.weedCoverMode = 'reconciled';
                            obs.weedDetails = obs.weedDetails.filter(w => !isMixedWeedPlaceholder(String(w?.species || '')));
                            (obs.weedDetails || []).forEach(w => {
                                const sp = String(w?.species || '').trim().toLowerCase();
                                if (!sp || sp === 'total') return;
                                const c = toNum(w?.cover) || 0;
                                w.status = c > 0.1 ? 'Unaffected' : 'Not detected';
                            });
                        } else {
                            const baselineTotal = clamp(toNum(obs.weedCover) || 0, 0, 100);
                            obs.weedCover = baselineTotal;
                            obs.weedCoverMode = 'reconciled';
                            let keptMixed = false;
                            obs.weedDetails = obs.weedDetails.filter(w => {
                                const isMixed = isMixedWeedPlaceholder(String(w?.species || ''));
                                if (!isMixed) return true;
                                if (keptMixed) return false;
                                keptMixed = true;
                                return true;
                            }).map(w => {
                                if (!isMixedWeedPlaceholder(String(w?.species || ''))) return w;
                                return { ...w, cover: baselineTotal, status: 'Baseline reference' };
                            });
                            if (!obs.weedDetails.some(w => isMixedWeedPlaceholder(String(w?.species || '')))) {
                                obs.weedDetails.push({
                                    species: 'Mixed weed population',
                                    cover: baselineTotal,
                                    status: 'Baseline reference',
                                    notes: 'Auto-baseline: mixed weed baseline synthesized from DAA 0 total cover.'
                                });
                            }
                        }

                        const totalRows = obs.weedDetails.filter(w => String(w?.species || '').trim().toLowerCase() === 'total');
                        totalRows.forEach(t => { t.cover = obs.weedCover; });
                    }
                });

                return normalized;
            };

export class AnalysisEngine {
                constructor(projectId, state) {
                    this.projectId = projectId;
                    this.state = state; // Global state reference
                    this.trials = state.trials.filter(t => t.ProjectID === projectId);
                    this.blocks = state.blocks.filter(b => b.ProjectID === projectId);

                    // Identify treatments (Formulations)
                    this.treatments = [...new Set(this.trials.map(t => t.FormulationName))];

                    // Identify UTC (Untreated Control)
                    this.utcName = this.treatments.find(t =>
                        t.toLowerCase().includes('control') ||
                        t.toLowerCase().includes('untreated') ||
                        t.toLowerCase().includes('check')
                    );
                }

                /**
                 * Fetch optimized analysis data from backend
                 */
                async fetchBackendData() {
                    try {
                        const result = await apiCall('getProjectAnalysisData', { projectId: this.projectId });
                        if (result && result.success) {
                            this.backendData = result;
                            return result;
                        }
                        throw new Error(result.message || 'Failed to fetch backend data');
                    } catch (e) {
                        console.error('[AnalysisEngine] Backend fetch failed, falling back to local:', e);
                        return null;
                    }
                }

                getReplications(treatmentName) {
                    if (this.backendData && this.backendData.dataMatrix && this.backendData.dataMatrix[treatmentName]) {
                        return this.backendData.dataMatrix[treatmentName];
                    }
                    return this.trials.filter(t => t.FormulationName === treatmentName);
                }

                // Get aggregated data for a specific metric
                getData(metric, species = null, daa = null) {
                    const data = {};
                    this.treatments.forEach(trt => {
                        const reps = this.getReplications(trt);
                        data[trt] = reps.map(r => {
                            // If using backend data
                            if (r.trialId) {
                                if (metric === 'yield') return r.yield || 0;
                                if (metric === 'cover') return r.cover || 0;
                                return 0;
                            }

                            // Local fallback
                            if (metric === 'yield') return parseFloat(r.Yield || 0);
                            const eff = safeJsonParse(r.EfficacyDataJSON, []);
                            if (eff.length === 0) return 0;
                            let obs = daa !== null ? (eff.find(e => e.daa === daa) || eff[eff.length - 1]) : eff.sort((a, b) => b.daa - a.daa)[0];
                            if (!obs) return 0;
                            if (metric === 'cover') {
                                if (species) {
                                    const canonicalSpecies = window.canonicalizeWeedSpecies(species);
                                    const d = (obs.weedDetails || []).find(w => window.canonicalizeWeedSpecies(w.species) === canonicalSpecies);
                                    return d ? parseFloat(d.cover) : 0;
                                }
                                return (obs.weedDetails || []).reduce((sum, w) => sum + parseFloat(w.cover), 0);
                            }
                            return 0;
                        });
                    });
                    return data;
                }

                // Main Analysis Method
                async analyze(metric, species = null, daa = null, options = {}) {
                    // Try to use backend data first
                    await this.fetchBackendData();

                    const dataMap = this.getData(metric, species, daa);
                    const treatments = Object.keys(dataMap);
                    const anovaData = treatments.map(t => dataMap[t]);

                    const means = {};
                    treatments.forEach(t => {
                        means[t] = jStat.mean(dataMap[t]);
                    });

                    let anovaResults = this.calculateANOVA(anovaData);

                    const efficacy = {};
                    if (this.utcName && means[this.utcName] > 0) {
                        treatments.forEach(t => {
                            if (metric === 'cover') {
                                efficacy[t] = ((means[this.utcName] - means[t]) / means[this.utcName]) * 100;
                            } else {
                                efficacy[t] = 0;
                            }
                        });
                    }

                    // Build counts per treatment for robust LSD in unbalanced cases
                    const counts = {};
                    treatments.forEach((tName, idx) => {
                        const arr = dataMap[tName] || [];
                        counts[tName] = arr.filter(v => !isNaN(v)).length || anovaData[0]?.length || 1;
                    });
                    const postHocMethod = (options.postHoc === 'tukey') ? 'tukey' : 'lsd';
                    const alpha = (typeof options.alpha === 'number' && isFinite(options.alpha)) ? options.alpha : 0.05;
                    const postHoc = this.getLetterGrouping(means, anovaResults.msError, anovaResults.dfError, counts, { method: postHocMethod, alpha });

                    const formattedGrouping = treatments.map(t => ({
                        name: t,
                        mean: means[t],
                        grouping: postHoc.letters[t] || '-'
                    })).sort((a, b) => b.mean - a.mean);

                    const results = {
                        means,
                        efficacy,
                        anova: anovaResults,
                        postHoc: postHoc,
                        lsdResults: postHoc.method === 'lsd' ? { ...postHoc, groupings: formattedGrouping } : null,
                        tukeyResults: postHoc.method === 'tukey' ? { ...postHoc, groupings: formattedGrouping } : null,
                        grouping: formattedGrouping,
                        raw: dataMap,
                        balance: {
                            isBalanced: (new Set(Object.values(counts))).size === 1,
                            counts: counts
                        },
                        timestamp: new Date().toISOString(),
                        metric: metric
                    };

                    // PERSIST RESULTS TO BACKEND
                    if (options.persist !== false) {
                        try {
                            await apiCall('saveAnalysisResults', {
                                projectId: this.projectId,
                                results: results
                            });
                            await apiCall('logAnalysisRun', {
                                projectId: this.projectId,
                                metric: metric,
                                fValue: anovaResults.fVal,
                                pValue: anovaResults.pVal,
                                significance: formatSignificance(anovaResults.pVal).symbol,
                                results: results
                            });
                            console.log('[AnalysisEngine] Results persisted to sheet');
                        } catch (e) {
                            console.error('[AnalysisEngine] Failed to persist results:', e);
                        }
                    }

                    return results;
                }

                calculateANOVA(groups) {
                    // groups is array of arrays: [[r1, r2, ...], [r1, r2, ...]]
                    // Handle both balanced and unbalanced RCBD
                    const t = groups.length;
                    const lens = groups.map(g => g.length);
                    const isBalanced = lens.every(l => l === lens[0]);

                    if (isBalanced) {
                        const r = lens[0];
                        const N = t * r;
                        const flat = groups.flat();
                        const grandTotal = flat.reduce((a, b) => a + b, 0);
                        const grandMean = grandTotal / N;
                        const CF = (grandTotal * grandTotal) / N;

                        // SS Total
                        const ssTotal = flat.reduce((acc, val) => acc + (val * val), 0) - CF;

                        // SS Treatments
                        let ssTreat = 0;
                        groups.forEach(g => {
                            const trTotal = g.reduce((a, b) => a + b, 0);
                            ssTreat += (trTotal * trTotal) / r;
                        });
                        ssTreat -= CF;

                        // SS Blocks (Rows)
                        let ssBlock = 0;
                        for (let j = 0; j < r; j++) {
                            let blTotal = 0;
                            for (let i = 0; i < t; i++) blTotal += groups[i][j];
                            ssBlock += (blTotal * blTotal) / t;
                        }
                        ssBlock -= CF;

                        // SS Error
                        const ssError = Math.max(0, ssTotal - ssTreat - ssBlock);

                        // DF
                        const dfTreat = t - 1;
                        const dfBlock = r - 1;
                        const dfError = (t - 1) * (r - 1);
                        const dfTotal = N - 1;

                        // MS
                        const msTreat = ssTreat / dfTreat;
                        const msBlock = ssBlock / dfBlock;
                        const msError = ssError / dfError;

                        // F & P
                        const fVal = msTreat / msError;
                        const pVal = (typeof jStat !== 'undefined') ? 1 - jStat.centralF.cdf(fVal, dfTreat, dfError) : 0.05;

                        return {
                            ssTreat, ssBlock, ssError, ssTotal,
                            dfTreat, dfBlock, dfError, dfTotal,
                            msTreat, msBlock, msError,
                            fVal, pVal, grandMean,
                            cv: (Math.sqrt(msError) / grandMean) * 100
                        };
                    }

                    // Unbalanced fallback (robust RCBD without interaction)
                    // Flatten and compute grand mean
                    const flatVals = [];
                    groups.forEach(g => g.forEach(v => { if (!isNaN(v)) flatVals.push(v); }));
                    const N = flatVals.length;
                    const grandMean = flatVals.reduce((a, b) => a + b, 0) / (N || 1);

                    // Treatment means and counts
                    const trMeans = groups.map(g => {
                        const vals = g.filter(v => !isNaN(v));
                        return vals.length ? jStat.mean(vals) : 0;
                    });
                    const trCounts = groups.map(g => g.filter(v => !isNaN(v)).length);

                    // Block means across available treatments
                    const rUnique = Math.max(...lens);
                    const blMeans = [];
                    const blCounts = [];
                    for (let j = 0; j < rUnique; j++) {
                        const vals = [];
                        for (let i = 0; i < t; i++) {
                            const v = groups[i][j];
                            if (v !== undefined && !isNaN(v)) vals.push(v);
                        }
                        blMeans[j] = vals.length ? jStat.mean(vals) : 0;
                        blCounts[j] = vals.length;
                    }

                    // SS Total
                    let ssTotal = 0;
                    flatVals.forEach(v => { ssTotal += Math.pow(v - grandMean, 2); });

                    // SS Treatments
                    let ssTreat = 0;
                    for (let i = 0; i < t; i++) {
                        ssTreat += trCounts[i] * Math.pow(trMeans[i] - grandMean, 2);
                    }

                    // SS Blocks
                    let ssBlock = 0;
                    for (let j = 0; j < rUnique; j++) {
                        ssBlock += blCounts[j] * Math.pow(blMeans[j] - grandMean, 2);
                    }

                    const ssError = Math.max(0, ssTotal - ssTreat - ssBlock);

                    const dfTreat = t - 1;
                    const dfBlock = rUnique - 1;
                    const dfError = Math.max(1, N - t - rUnique + 1);
                    const dfTotal = N - 1;

                    const msTreat = ssTreat / dfTreat;
                    const msBlock = ssBlock / dfBlock;
                    const msError = ssError / dfError;

                    const fVal = msTreat / msError;
                    const pVal = (typeof jStat !== 'undefined') ? 1 - jStat.centralF.cdf(fVal, dfTreat, dfError) : 0.05;

                    return {
                        ssTreat, ssBlock, ssError, ssTotal,
                        dfTreat, dfBlock, dfError, dfTotal,
                        msTreat, msBlock, msError,
                        fVal, pVal, grandMean,
                        cv: (Math.sqrt(msError) / grandMean) * 100
                    };
                }

                getLetterGrouping(meansObj, mse, dfError, countsOrReps, options = {}) {
                    const method = (options.method === 'tukey') ? 'tukey' : 'lsd';
                    const alpha = (typeof options.alpha === 'number' && isFinite(options.alpha)) ? options.alpha : 0.05;
                    const tVal = (typeof jStat !== 'undefined') ? jStat.studentt.inv(1 - (alpha / 2), dfError) : 2.05;

                    const trNames = Object.keys(meansObj);
                    const k = trNames.length;
                    const treatmentStats = trNames.map(name => ({ treatmentId: name, mean: meansObj[name] }));

                    const counts = {};
                    if (typeof countsOrReps === 'number') {
                        trNames.forEach(n => counts[n] = Math.max(1, countsOrReps));
                    } else if (countsOrReps && typeof countsOrReps === 'object') {
                        trNames.forEach(n => counts[n] = Math.max(1, countsOrReps[n] || 1));
                    } else {
                        trNames.forEach(n => counts[n] = 1);
                    }

                    const minN = Math.max(1, Math.min(...Object.values(counts)));

                    if (method === 'tukey') {
                        // Proper studentized range critical value from q-table
                        const qCrit = (typeof getStudentizedRangeCritical === 'function')
                            ? getStudentizedRangeCritical(alpha, k, dfError)
                            : 3.80; // Improved fallback for k around 4-5

                        const hsdRef = qCrit * Math.sqrt(mse / minN);
                        const isNonSignificant = (a, b) => {
                            const ni = counts[a.treatmentId] || 1;
                            const nj = counts[b.treatmentId] || 1;
                            const hsd_ij = qCrit * Math.sqrt(mse * 0.5 * (1 / ni + 1 / nj));
                            return Math.abs(a.mean - b.mean) <= hsd_ij;
                        };
                        assignCLDByComparator(treatmentStats, isNonSignificant);

                        const letters = {};
                        treatmentStats.forEach(ts => { letters[ts.treatmentId] = ts.rank; });
                        return { method: 'tukey', alpha, qCrit, hsd: hsdRef, value: hsdRef, letters };
                    }

                    const lsdRef = tVal * Math.sqrt((2 * mse) / minN);
                    const isNonSignificant = (a, b) => {
                        const ni = counts[a.treatmentId] || 1;
                        const nj = counts[b.treatmentId] || 1;
                        const lsd_ij = tVal * Math.sqrt(mse * (1 / ni + 1 / nj));
                        return Math.abs(a.mean - b.mean) <= lsd_ij;
                    };
                    assignCLDByComparator(treatmentStats, isNonSignificant);

                    const letters = {};
                    treatmentStats.forEach(ts => { letters[ts.treatmentId] = ts.rank; });
                    return { method: 'lsd', alpha, lsd: lsdRef, value: lsdRef, letters };
                }
            }