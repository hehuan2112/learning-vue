<script setup>
import { stringify } from 'postcss';
import { ref } from 'vue';

// input param
const props = defineProps({
    input_format: String,
    treatments: Array
})

const params = ref({
    _analyze_type: {
        selected: 'nma',
        use: true,
        disabled: false,
    },

    analysis_engine: {
        selected: 'metajs',
        use: true,
        disabled: false,
        options: [
            {text: 'Meta.js', value: 'metajs'},
            {text: 'R Backend Service', value: 'metar'}
        ]
    },

    input_format: {
        selected: 'PRE_SMLU',
        use: true,
        disabled: true,
        options: [
            {text: 'Pre-calculated| SM, Lower, Upper', value: 'PRE_SMLU'},
            {text: 'Raw| Event, Total', value: 'RAW_ET'},
            {text: 'Raw| Follow-up Time, Event, Total', value: 'RAW_FTET'}
        ]
    },

    reference_treatment: {
        selected: '',
        use: true,
        disabled: false,
        options: []
    },

    analysis_method: {
        selected: 'freq',
        use: true,
        disabled: false,
        options: [
            {text: 'Frequentist NMA', value: 'freq'},
            {text: 'Bayesian NMA', value: 'bayes'},
        ]
    },

    measure_of_effect: {
        selected: 'HR',
        use: true,
        disabled: false,
        options: [
            {text: 'Hazard Ratio', value: 'HR'},
            {text: 'Odds Ratio', value: 'OR'},
            {text: 'Relative Risk', value: 'RR'},
            {text: 'Risk Difference', value: 'RD'}
        ]
    },

    fixed_or_random: {
        selected: 'fixed',
        use: true,
        disabled: false,
        options: [
            {text: 'Fixed Effect Model', value: 'fixed'},
            {text: 'Random Effect Model', value: 'random'}
        ]
    },

    which_is_better: {
        selected: 'small',
        use: true,
        disabled: false,
        options: [
            {text: 'Lower is Better', value: 'small'},
            {text: 'Larger is Better', value: 'big'}
        ]
    },

});

function show_cfg_option(param_name, option) {
    switch (param_name) {
        case 'measure_of_effect':
            switch (option) {
                case 'HR':
                    if (params.value.input_format.selected == 'PRE_SMLU') {
                        return true;
                    } else {
                        return false;
                    }
                case 'OR':
                    if (params.value.analysis_engine.selected == 'metar') {
                        return true;
                    } else {
                        return false;
                    }
                case 'RR':
                    if (params.value.analysis_engine.selected == 'metar') {
                        return true;
                    } else {
                        return false;
                    }
                case 'RD':
                    if (params.value.analysis_engine.selected == 'metar') {
                        return true;
                    } else {
                        return false;
                    }
            }
            break;

        case 'fixed_or_random':
            switch (option) {
                case 'fixed':
                    return true;
                case 'random':
                    if (params.value.analysis_engine.selected == 'metar') {
                        return true;
                    } else {
                        return false;
                    }
            }
            break;

        case 'analysis_method':
            switch (option) {
                case 'freq':
                    return true;
                case 'bayes':
                    if (params.value.analysis_engine.selected == 'metar') {
                        return true;
                    } else {
                        return false;
                    }
            }
            
    }
    return true;
}

function get_params() {
    let p = {};
    for (const key in params.value) {
        p[key] = params.value[key].selected;
    }

    // convert some values
    p['small_values'] = {
        'small': 'good',
        'big': 'bad'
    }[p.which_is_better];

    return p;
}

// expose some functions
defineExpose({
    get_params
})
</script>

<template>
<div class="nma-paramter-box">
    <div class="param-item">
        <div class="item-label">
            <label title="Bayesian NMA Backend Engine">Input Format:</label>
        </div>
        <div class="item-value">
            <select v-model="params.input_format.selected" v-bind:disabled="params.input_format.disabled">
                <option v-for="option in params.input_format.options" v-bind:value="option.value">
                    {{ option.text }}
                </option>
            </select>
        </div>

    </div>


    <div class="param-item">
        <div class="item-label">
            <label title="Bayesian NMA Backend Engine">Analysis Engine:</label>
        </div>
        <div class="item-value">
            <select v-model="params.analysis_engine.selected" 
                v-bind:disabled="params.analysis_engine.disabled">
                <option v-for="option in params.analysis_engine.options"
                    v-bind:value="option.value">
                    {{ option.text }}
                </option>
            </select>
        </div>

    </div>

    <div class="param-item">
        <div class="item-label">
            <label title="Bayesian NMA Backend Engine">Analysis Method:</label>
        </div>
        <div class="item-value">
            <select v-model="params.analysis_method.selected"
                v-bind:disabled="params.analysis_method.disabled">
                <template v-for="option in params.analysis_method.options">
                    <option v-if="show_cfg_option('analysis_method', option.value)"
                        v-bind:value="option.value">
                        {{ option.text }}
                    </option>
                </template>
            </select>
        </div>

    </div>

    <div class="param-item">
        <div class="item-label">
            <label title="Measure of Effect">Measure of Effect:</label>
        </div>
        <div class="item-value">
            <select v-model="params.measure_of_effect.selected"
                v-bind:disabled="params.measure_of_effect.disabled">
                <template v-for="option in params.measure_of_effect.options">
                    <option v-if="show_cfg_option('measure_of_effect', option.value)"
                        v-bind:value="option.value">
                        {{ option.text }}
                    </option>
                </template>
            </select>
        </div>

    </div>

    <!-- <div class="param-item">
        <div class="item-label">
            <label title="Reference Treatment">Ref. Treatment: </label>
        </div>
        <div class="item-value">
            <select v-model="params.reference_treatment.selected">
                <template v-for="tr in treatments">
                    <option v-bind:value="tr">
                        {{ tr }}
                    </option>
                </template>
            </select>
        </div>

    </div> -->

    <div class="param-item">
        <div class="item-label">
            <label title="">Fixed / Random: </label>
        </div>
        <div class="item-value">
            <select v-model="params.fixed_or_random.selected">
                <template v-for="option in params.fixed_or_random.options">
                    <option v-if="show_cfg_option('fixed_or_random', option.value)"
                        v-bind:value="option.value">
                        {{ option.text }}
                    </option>
                </template>
            </select>
        </div>
    </div>

    <div class="param-item">
        <div class="item-label">
            <label title="">Which is Better: </label>
        </div>
        <div class="item-value">
            <select v-model="params.which_is_better.selected">
                <template v-for="option in params.which_is_better.options">
                    <option v-if="show_cfg_option('which_is_better', option.value)"
                        v-bind:value="option.value">
                        {{ option.text }}
                    </option>
                </template>
            </select>
        </div>
    </div>
</div>
</template>

<style scoped>
.nma-paramter-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px 0;
}
.param-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    margin-bottom: 3px;
}
.item-label {
    width: 150px;
    text-align: left;
}
.item-value {
    width: calc( 100% - 150px );
}
.item-value select {
    width: 100%;
}
</style>
