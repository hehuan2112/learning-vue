'use strict';

export const coe_helper = {
    // values
    Y: 'Y',
    PY: 'PY',
    PN: 'PN',
    N: 'N',
    NI: 'NI',
    NA: 'NA',

    // risk
    LOW: 'L',
    HIGH: 'H',
    SOME: 'M',

    // level
    L0: '0',
    L1: '1',
    L2: '2',
    L3: '3',
    L4: '4',

    

    ///////////////////////////////////////////////////////////////////////////
    // Inconsistency
    ///////////////////////////////////////////////////////////////////////////

    judge_inconsistency: function(vals) {
        if (vals.i2 < 0.5 || vals.heter_pval < 0.1) {
            return this.L1; // Not serious
        } else {
            return this.L2; // Serious
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // Publication Bias
    ///////////////////////////////////////////////////////////////////////////

    judge_publication_bias: function(
        n_studies, 
        egger_test_p_value,
        difference_sm
    ) {
        if (n_studies < 10) {
            return '1'; // Not applicable
        } 

        // ok now > 10
        if (egger_test_p_value >= 0.05) {
            return '1'; // Not serious
        }

        if (difference_sm > 0.2) {
            return '2'; // Serious
        }

        return '1'; // Not serious
    },

    ///////////////////////////////////////////////////////////////////////////
    // Imprecision
    ///////////////////////////////////////////////////////////////////////////

    judge_imprecision: function(vals) {
        if (vals['is_t_included_in_ci_of_rd'])
            if (vals['is_t_user_provided'])
                if (vals['is_both_ts_included_in_ci_of_rd'])
                    return this.L4
                else
                    return this.L3
            else
                if (vals['is_both_200p1000_included_in_ci_of_rd'])
                    return this.L4
                else
                    return this.L3
        else
            if (vals['is_relative_effect_large'])
                if (vals['ma_size'] >= vals['ois'])
                    return this.L1
                else if (vals['ma_size'] >= vals['ois'] * 0.5)
                    return this.L2
                else
                    return this.L3
            else
                return this.L1
        
    },

    ///////////////////////////////////////////////////////////////////////////
    // Indirectness
    ///////////////////////////////////////////////////////////////////////////

    judge_indirectness: function(
        n_very_close,
        n_moderately_close,
        n_not_close,
        n_ind_na,
        n_studies
    ) {
        if (n_studies == 0) {
            return this.L0;
        }

        if (n_ind_na > 0) {
            return this.L0;
        }

        // get the percentage of very close studies
        var percentage_very_close = n_very_close / n_studies;

        if (percentage_very_close >= 0.75) {
            return this.L1;
        }
        
        if (n_not_close == 0) {
            return this.L2;
        }

        return this.L3;
    },

    judge_ind_closeness: function(qs) {
        var n_dis = 0;
        var n_id_or_br = 0;
        var n_na = 0;

        for (let i = 0; i < qs.length; i++) {
            const q = qs[i];
            if (q == 'NA' || q == '') {
                // ??? 
                n_na += 1;
                continue;
            }
            if (q == 'D') {
                n_dis += 1;
            } else {
                n_id_or_br += 1;
            }
        }

        if (n_dis == 1) {
            return 'M'; // moderately close
        }

        if (n_dis > 1) {
            return 'N'; // not close
        }

        if (n_id_or_br == qs.length) {
            return 'V'; // very close
        }

        return 'NA'; // I don't know

    },


    ///////////////////////////////////////////////////////////////////////////
    // General CoE functions
    ///////////////////////////////////////////////////////////////////////////

    get_overall_coe: function(decision) {
        var risk_of_bias = parseInt(''+decision.risk_of_bias);
        var inconsistency = parseInt(''+decision.inconsistency);
        var indirectness = parseInt(''+decision.indirectness);
        var imprecision = parseInt(''+decision.imprecision);
        var publication_bias = parseInt(''+decision.publication_bias);

        var vals = [
            risk_of_bias,
            inconsistency,
            indirectness,
            imprecision,
            publication_bias
        ];
        var cnt = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0
        };
        for (let i = 0; i < vals.length; i++) {
            const val = vals[i];
            cnt[val] += 1;
        }

        var ret = 0;
        if (cnt[1] == 5) {
            // 1 in all factors
            ret = 1;
            
        } else if (cnt[1] == 4 && cnt[2] == 1) {
            // 2 in any one factor
            ret = 2;

        } else if ((cnt[1] == 4 && cnt[3] == 1) || 
                   (cnt[1] == 3 && cnt[2] == 2) ||
                   (cnt[1] == 3 && cnt[2] == 1 && cnt[3] == 1)) {
            // 3 in any one factor or 2 in two factors
            ret = 3;

        } else if (cnt[4] >= 1 || cnt[3] >= 2 || cnt[2] >= 3) {
            // 4 in any one factor, or 3 in two factors, or 2 in three
            ret = 4;

        } else {
            // what??? which means non-of the above cases match
            // the result is not applicable
        }
        console.log('* get_overall_coe', vals, '->', cnt, '=', ret);

        // convert to string
        return '' + ret;
    },

    /**
     * Get the value of a specific domain in coe
     * 
     * {
     *     rj: {
     *         decision: {
     *             risk_of_bias: VALUE,
     *             inconsistency: VALUE,
     *             imprecision: VALUE,
     *             publication_bias: VALUE,
     *             indirectness: VALUE,
     *         }
     *     },
     *     ar:  {
     *         decision: {
     *             risk_of_bias: VALUE,
     *             inconsistency: VALUE,
     *             imprecision: VALUE,
     *             publication_bias: VALUE,
     *             indirectness: VALUE,
     *         }
     *     }
     * }
     * 
     * @param {Object} coe Certainty of Evidence object
     */
    get_val_from_coe: function(coe, type, domain) {
        // the CoE may be not available
        if (typeof(coe) == 'undefined' ||
            coe == null) {
            return 'NA';
        }

        // may not source type? rj or 
        if (!coe.hasOwnProperty(type)) {
            return 'NA';
        }

        // may not have decision?
        if (!coe[type].hasOwnProperty('decision')) {
            return 'NA';
        }

        // no such domain???
        if (!coe[type].decision.hasOwnProperty(domain)) {
            if (domain == 'overall') {
                // need to convert the 
                return this.get_overall_coe(coe[type].decision);
            } else {
                return 'NA';
            }
        }

        var val = coe[type].decision[domain];

        return val;
    },

    val_to_label: function(val, domain) {
        // convert to string
        var v = "" + val;
        var ret = "NA";

        // check if the followings
        if (['risk_of_bias', 'imprecision'].includes(domain)) {
            if (['0', '1', '2', '3', '4', 'L', 'M', 'H', 'NA'].includes(v)) {
                ret = {
                    '0': 'Not available',
                    '1': 'Not serious',
                    '2': 'Serious',
                    '3': 'Very serious',
                    '4': 'Extremely serious',
                    'L': 'Low risk',
                    'M': 'Some concerns',
                    'H': 'High risk',
                    'NA': 'Not decided'
                }[v];
            } else {
                ret = 'NA';
            }

        } else if (['indirectness'].includes(domain)) {
            if (['0', '1', '2', '3', '4', 'V', 'M', 'N', 'NA'].includes(v)) {
                ret = {
                    '0': 'Not available',
                    '1': 'Not serious',
                    '2': 'Serious',
                    '3': 'Very serious',
                    '4': 'Extremely serious',
                    'V': 'Very close',
                    'M': 'Moderately close',
                    'N': "Not close",
                    'NA': 'Not decided'
                }[v];
            } else {
                ret = 'NA';
            }

        } else if (['inconsistency'].includes(domain)) {
            if (['0', '1', '2', '3', '4'].includes(v)) {
                ret = {
                    '0': 'Not applicable',
                    '1': 'Not serious',
                    '2': 'Serious',
                    '3': 'Very serious',
                    '4': 'Extremely serious',
                }[v];
            } else {
                ret = 'NA';
            }

        } else if (['incoherence', 'intransitivity'].includes(domain)) {
            if (['0', '1', '2', '3'].includes(v)) {
                ret = {
                    '0': 'Not applicable',
                    '1': 'No serious',
                    '2': 'Serious',
                    '3': 'Very serious'
                }[v];
            } else {
                ret = 'NA';
            }

        } else if (domain == 'publication_bias') {
            if (['0', '1', '2'].includes(v)) {
                ret = {
                    '0': 'Not applicable',
                    '1': 'Not serious',
                    '2': 'Serious'
                }[v];
            } else {
                ret = 'NA'
            }

        } else if (domain == 'importance') {
            if (['0', '1', '2']) {
                ret = {
                    '0': 'Not applicable',
                    '1': 'Important',
                    '2': 'Critical'
                }[v];
            } else {
                ret = 'NA';
            }

        } else if (domain == 'overall') {
            if (['0', '1', '2', '3', '4'].includes(v)) {
                ret = {
                    '0': 'Not applicable',
                    '1': 'Very Low',
                    '2': 'Low',
                    '3': 'Moderate',
                    '4': 'High'
                }[v];
            } else {
                ret = 'NA'
            }

        } else {
            ret = v;
        }

        return ret;
    },



    ///////////////////////////////////////////////////////////////////////////
    // Visualization Helpers for CoE based on Mermaid
    ///////////////////////////////////////////////////////////////////////////
    activate_link_style: ' stroke:red,color:red;\n',

    get_rob_mermaid: function(vals) {
        var chart_desc = `
graph TD
%% define class
classDef HITL fill:yellow,stroke:orange;
%% define nodes
s1["Are all studies low risk?"]
s2["Are all studies high risk or some concerns?"]
s3["Subgroup analysis (low vs. high/some)"]
s4["Percent of high-risk studies"]
s_init_hitl{{"HITL: Are all studies evaluated?"}}:::HITL
s_hitl{{"HITL: Review"}}:::HITL

%% define links
%% link 0
s1 -- "Yes" --> r1([1: Not serious])
%% link 1
s1 -- "No" --> s2
%% link 2
s2 -- "Yes" --> r2([2: Serious])
%% link 3
s2 -- "No" --> s3
%% link 4
s3 -- "p<0.05" --> r3([3: Very serious])
%% link 5
s3 -- "p≥0.05" --> s4
%% link 6
s4 -- "<50%" --> r4([1: Not serious])
%% link 7
s4 -- "≥50%" --> r5([2: Serious])
%% link 8 for HITL
r2 -- "Optional" --> s_hitl 
%% link 9
s_hitl -- "Rate down" --> r6([3-4: Very-Extremely serious])
%% link 10 for init
s_init_hitl -- "Yes" --> s1
%% link 11 for init no
s_init_hitl -- "No" --> r00([0: Not available])
        `
        if (typeof(vals) == 'undefined') {
            return chart_desc;
        }

        // ok, let's add more styles for path
        if (vals.n_rob_na == 0) {
            // all studies are reviewed
            chart_desc += 'linkStyle 10' + this.activate_link_style;
        } else {
            chart_desc += 'linkStyle 11' + this.activate_link_style;

            // no need to render other conditions
            return chart_desc;
        }

        if (vals.is_all_low) {
            chart_desc += 'linkStyle 0' + this.activate_link_style;

            // no need to render other conditions
            return chart_desc;
        } else {
            chart_desc += 'linkStyle 1' + this.activate_link_style;
        }

        if (vals.is_all_high) {
            chart_desc += 'linkStyle 2' + this.activate_link_style;
            // no need to render other conditions
            return chart_desc;

        } else {
            chart_desc += 'linkStyle 3' + this.activate_link_style;
        }

        if (vals.subg_pval < 0.05) {
            chart_desc += 'linkStyle 4' + this.activate_link_style;
            // no need to render other conditions
            return chart_desc;

        } else {
            chart_desc += 'linkStyle 5' + this.activate_link_style;

            if (vals.per_high_stus < 0.5) {
                chart_desc += 'linkStyle 6' + this.activate_link_style;
            } else {
                chart_desc += 'linkStyle 7' + this.activate_link_style;
            }
        }
        
        return chart_desc;
    },

    get_inc_mermaid: function(vals) {
        var chart_desc = `
graph TD
%% define class
classDef HITL fill:yellow,stroke:orange;
%% define nodes
s1["I-sq as an indication of statistical heterogeneity"]
s2["Are 75% of the studies within same category?"]
s3{{"HITL Review"}}:::HITL

%% define links
%% link 0
s1 -- "<50%" --> r1([1: Not serious])
%% link 1
s1 -- "≥50%" --> s2
%% link 2
s2 -- "Yes" --> r2([1: Not serious])
%% link 3
s2 -- "No" --> r3([2: Serious])
%% link 4
r3 -- "Optional" --> s3
%% link 5
s3 -- "Rate down" --> r4([3: Very serious])
        `;
        if (typeof(vals) == 'undefined') {
            return chart_desc;
        }

        // ok, let's add more styles for path
        if (vals.i2 < 0.5 || vals.heter_pval < 0.1) {
            chart_desc += 'linkStyle 0' + this.activate_link_style;
            // no need to render other conditions
            return chart_desc;

        } else {
            chart_desc += 'linkStyle 1' + this.activate_link_style;
        }

        if (vals.is_major_in_same_category) {
            chart_desc += 'linkStyle 2' + this.activate_link_style;
        } else {
            chart_desc += 'linkStyle 3' + this.activate_link_style;
        }
        return chart_desc;
    },

    get_pbb_mermaid: function(vals) {
        var chart_desc = `
graph TD
%% define class
classDef HITL fill:yellow,stroke:orange;
%% define nodes
s1[Number of studies]
s2[Egger's Regression Test]
s3[Does adjusted effect show less benefit?]

%% define links
%% link 0
s1 -- "N<10" --> r1([0: Not applicable])
%% link 1
s1 -- "N≥10" --> s2
%% link 2
s2 -- "p<0.05" --> s3
%% link 3
s2 -- "p≥0.05" --> r3([1: Not serious])
%% link 4
s3 -- "diff<20%" --> r5([1: Not serious])
%% link 5
s3 -- "diff≥20%" --> r4([2: Serious])
        `
        // if no values, just return this chart
        if (typeof(vals) == 'undefined') {
            return chart_desc;
        }

        // ok, let's add more styles for path
        if (vals.n_studies < 10) {
            chart_desc += 'linkStyle 0' + this.activate_link_style;
        } else {
            chart_desc += 'linkStyle 1' + this.activate_link_style;
        }

        if (vals.egger_test_p_value < 0.05) {
            chart_desc += 'linkStyle 2' + this.activate_link_style;
        } else {
            chart_desc += 'linkStyle 3' + this.activate_link_style;
        }

        if (vals.difference_sm < 0.2) {
            chart_desc += 'linkStyle 4' + this.activate_link_style;
        } else {
            chart_desc += 'linkStyle 5' + this.activate_link_style;
        }

        return chart_desc;
    },

    get_imp_mermaid: function(vals) {
        var chart_desc = `
graph TD
%% define class
classDef HITL fill:yellow,stroke:orange;
%% define nodes
s0["Get threshold T\nUser-provided or null(0)"]
s1["Does CI of RD include T?"]
s2["Is relative effect (RR/OR)\n<0.7 or >1.3?"]
s3["Calculate OIS"]

%% define link
%% link 0
s0 --> s1
%% link 1
s1 -- Yes --> s_tup["Is T user-provided?"]
%% link 2
s_tup -- Yes --> s_mpt["Does CI of RD include\nboth - and + T?"]
%% link 3
s_mpt -- Yes --> r3a["4: Extremely serious"]
%% link 4
s_mpt -- No --> r2a["3: Very serious"]
%% link 5
s_tup -- No --> s_200p["Does CI of RD include\nboth - and +\n200 per 1,000?"]
%% link 6
s_200p -- Yes --> r3b["4: Extremely serious"]
%% link 7
s_200p -- No --> r2b["3: Very serious"]
%% link 8
s1 -- No --> s2
%% link 9
s2 -- No --> r2([1: Not serious])
%% link 10
s2 -- Yes --> s3
%% link 11
s3 -- "MA size ≥ OIS" --> r3([1: Not serious])
%% link 12
s3 -- "MA size in 50-100% OIS" --> r4([2: Serious])
%% link 13
s3 -- "MA size < 50% OIS" --> r5([3: Very serious])
        `;
        // if no values, just return this chart
        if (typeof(vals) == 'undefined') {
            return chart_desc;
        }
        // always get the T first
        chart_desc += 'linkStyle 0' + this.activate_link_style;

        if (vals.is_t_included_in_ci_of_rd) {
            chart_desc += 'linkStyle 1' + this.activate_link_style;
            
            if (vals.is_t_user_provided) {
                chart_desc += 'linkStyle 2' + this.activate_link_style;

                if (vals.is_both_ts_included_in_ci_of_rd) {
                    chart_desc += 'linkStyle 3' + this.activate_link_style;
                } else {
                    chart_desc += 'linkStyle 4' + this.activate_link_style;
                }
            } else {
                chart_desc += 'linkStyle 5' + this.activate_link_style;
                if (vals.is_both_200p1000_included_in_ci_of_rd) {
                    chart_desc += 'linkStyle 6' + this.activate_link_style;
                } else {
                    chart_desc += 'linkStyle 7' + this.activate_link_style;
                }
            }

        } else {
            chart_desc += 'linkStyle 8' + this.activate_link_style;
        }

        if (vals.is_relative_effect_large) {
            chart_desc += 'linkStyle 10' + this.activate_link_style;
            
            if (vals.ma_size > vals.ois) {
                chart_desc += 'linkStyle 11' + this.activate_link_style;
            } else if (vals.ma_size < 0.5 * vals.ois) {
                chart_desc += 'linkStyle 13' + this.activate_link_style;
            } else {
                chart_desc += 'linkStyle 12' + this.activate_link_style;
            }
        } else {
            chart_desc += 'linkStyle 9' + this.activate_link_style;
        }

        return chart_desc;
    },

    get_ind_mermaid: function(vals) {
        var chart_desc = `
graph TD
%% define class
classDef HITL fill:yellow,stroke:orange;
%% define nodes
s1[Is >75% of studies 'Very Close'?]
s2[Is none of studies 'Not Close'?]
s_init_hitl{{"HITL: Are all studies evaluated?"}}:::HITL

%% define links
%% link 0: for HITL
s_init_hitl -- "Yes" --> s1
%% link 1: for HITL
s_init_hitl -- "No" --> r0([0: Not available])
%% link 2
s1 -- "Yes" --> r1([1: Not serious])
%% link 3
s1 -- "No" --> s2
%% link 4
s2 -- "Yes" --> r2([2: Serious])
%% link 5
s2 -- "No" --> r3([3: Very serious])
        `;
        // if no values, just return this chart
        if (typeof(vals) == 'undefined') {
            return chart_desc;
        }

        // ok, let's add more styles for path
        if (vals.n_ind_na == 0) {
            chart_desc += 'linkStyle 0' + this.activate_link_style;

            if (vals.percentage_very_close >= 0.75) {
                chart_desc += 'linkStyle 2' + this.activate_link_style;
            } else {
                chart_desc += 'linkStyle 3' + this.activate_link_style;
            }

            if (vals.n_not_close == 0) {
                chart_desc += 'linkStyle 4' + this.activate_link_style;
            } else {
                chart_desc += 'linkStyle 5' + this.activate_link_style;
            }

        } else {
            chart_desc += 'linkStyle 1' + this.activate_link_style;
        }

        return chart_desc;
    },



    ///////////////////////////////////////////////////////////////////////////
    // Helpers for CoE
    ///////////////////////////////////////////////////////////////////////////

    isNA: function(v) {
        if (v == null || v == 'NA' || v == '') {
            return true;
        }
        return false;
    },

    fmt_value: function(v) {
        if (this.isNA(v)) {
            return 'NA';
        }

        // convert to upper case 
        var _v = v.toLocaleUpperCase();

        if (['Y', 'PY', 'PN', 'N', 'NI'].indexOf(_v)>=0) {
            return _v;

        } else {
            // what???
            return 'NA';
        }
    },
};
