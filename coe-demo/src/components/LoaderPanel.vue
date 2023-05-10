<script setup>
import { ref } from 'vue';

// input param
const props = defineProps({
    input_format: String,
    treatments: Array
})

const params = ref({
    measure_of_effect: {
        value: 'OR',
        disabled: false,
        type: 'select',
        options: [
            {text: 'Odds Ratio', value: 'OR'},
            {text: 'Risk Ratio', value: 'RR'},
            {text: 'Risk Difference', value: 'RD'},
        ],
        title: "Measure of Effect",
        description: "The measure of effect. Available values include: OR, RR, or RD."
    },

    imp_t: {
        value: '0',
        disabled: true,
        type: 'input',
        title: "Imprecision T",
        description: "The threshold for imprecision evaluation. It's optional. Default value is 0."
    },
});


function get_params() {
    let p = {};
    for (const key in params.value) {
        p[key] = params.value[key].value;
    }

    return p;
}

// expose some functions
defineExpose({
    get_params
})
</script>

<template>
<div class="paramter-box">
    
    <div v-for="param in params"
        class="param-item">
        <div class="item-label">
            <label>
                {{ param.title }}
            </label>
        </div>
        <div v-if="param.type == 'input'"
            class="item-value">
            <input type="text" 
                v-model="param.value" 
                v-bind:disabled="param.disabled">
            <p class="item-desc">
                {{ param.description }}
            </p>
        </div>

        <div v-else-if="param.type == 'select'"
            class="item-value">
            <select v-model="param.value" 
                v-bind:disabled="param.disabled">
                <option v-for="option in param.options"
                    v-bind:value="option.value">
                    {{ option.text }}
                </option>
            </select>
            <p class="item-desc">
                {{ param.description }}
            </p>
        </div>
    </div>


</div>
</template>

<style scoped>
.paramter-box {
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
    width: 120px;
    text-align: left;
}
.item-value {
    width: calc( 100% - 120px );
}
.item-desc {
    font-size: 0.9em;
}
.item-value select {
    width: 100%;
}
</style>
