<script setup>
import { ref } from 'vue';
import XLSXReader from './components/XLSXReader.vue';
import NMAParameter from './components/NMAParameter.vue';
import { metajs } from './utils/meta.js';
import { fig_lgtable } from './utils/fig_league_table.js';
import { fig_netplt } from './utils/fig_network_plot.js';
import { fig_fstplt } from './utils/fig_forest_plot.js';

// define ref on component
// https://vuejs.org/guide/essentials/template-refs.html#ref-on-component
const cXLSXReader = ref(null);
const cNMAParameter = ref(null);

// key vars for analysis
const input_format = ref(null);
const treatments = ref(null);

// init

function on_click_analyze() {
  const rs = cXLSXReader.value.get_rs();
  console.log('* got rs', rs.value);
  const params = cNMAParameter.value.get_params();
  console.log('* got params', params);

  let rst = metajs.netmeta(rs);
  console.log('* got nma rst', rst);

  // draw league table
  fig_lgtable.init();
  fig_lgtable.draw(rst);

  // draw network plot
  fig_netplt.init('fig_netplt_box');
  let data_netplt = rst2net(rst);
  console.log("* data_netplt", data_netplt);
  fig_netplt.draw(fig_netplt.sample);

  // get the max node degree
  let node_max_degree = { name: '', value: 0};
  for (let i = 0; i < data_netplt.nodes.length; i++) {
    if (data_netplt.nodes[i].value > node_max_degree.value) {
      node_max_degree = data_netplt.nodes[i];
    }
  }

  // draw forest plot
  fig_fstplt.init();
  let data_fstplt = rst2fst(
    rst,
    node_max_degree.name
  );
  console.log("* data_fstplt", data_fstplt);
  fig_fstplt.draw(
    data_fstplt
  );
}

function rst2net(rst) {
  var ds = rst.ds;
  var links = {};
  var nodes = {};

  for (let i = 0; i < ds.treat1.length; i++) {
    const t1 = ds.treat1[i];
    const t2 = ds.treat2[i];

    // update the nodes
    if (nodes.hasOwnProperty(t1)) {
      nodes[t1].value += 1;
    } else {
      nodes[t1] = {
        name: t1,
        value: 1
      }
    }

    if (nodes.hasOwnProperty(t2)) {
      nodes[t2].value += 1;
    } else {
      nodes[t2] = {
        name: t2,
        value: 1
      }
    }

    // update the links
    var t12 = t1 + '#' + t2;
    var t21 = t2 + "#" + t1;
    if (links.hasOwnProperty(t12)) {
      links[t12].value += 1;
    } else if (links.hasOwnProperty(t21)) {
      links[t21].value += 1;
    } else {
      links[t12] = {
        source: t1,
        target: t2,
        value: 1
      }
    }
  }

  var net = {
    nodes: [],
    links: []
  };
  for (const key in nodes) {
    net.nodes.push(nodes[key]);
  }
  for (const key in links) {
    net.links.push(links[key]);
  }

  return net;
}

function rst2fst(rst, cmp) {
  var fst = {
    title: 'Comparison vs "'+cmp+'"',
    subtitle: 'Fixed Effect Model',
    sm: 'HR',
    val_min: 0,
    val_max: 0,
    glb_min: 0,
    glb_max: 0,
    vals: []
  }
  // get the idx of cmp
  var cmp_idx = rst.ds.trt2idx[cmp];
  
  // update the vals
  for (let i = 0; i < rst.fixed.SM.length; i++) {
    if (i == cmp_idx) { continue; }
    let treat = rst.ds.treats[i];
    let value = rst.fixed.SM[cmp_idx][i];
    let lower = rst.fixed.SM_lower[cmp_idx][i];
    let upper = rst.fixed.SM_upper[cmp_idx][i];
    
    fst.vals.push({
      treatment: treat,
      val: value,
      lower: lower,
      upper: upper
    });

    // update max
    if (value > fst.val_max) { fst.val_max = value; }
    if (value < fst.val_min) { fst.val_min = value; }
    if (upper > fst.glb_max) { fst.glb_max = upper; }
    if (lower < fst.glb_min) { fst.glb_min = lower; }
  }

  return fst;
}

</script>

<template>
<div id="input_panel">
  <h2>
    <i class="fas fa-project-diagram"></i>
    Network Meta-analysis
  </h2>
  <!-- the xlsx reader -->
  <XLSXReader ref="cXLSXReader"></XLSXReader>
  <NMAParameter ref="cNMAParameter"
    :input_format="input_format"
    :treatments="treatments">
  </NMAParameter>

  <button @click="on_click_analyze"
    style="width: 100%;">
    <i class="fa fa-search"></i>
    Analyze
  </button>
</div>
<div id="vis_panel">
  <div class="box">
    <div class="box-header">
      <span class="fa fa-table"></span>
      LEAGUE TABLE <span id="tb-nma-league-name"></span>
    </div>
    <div class="box-body">
      <div style="line-height: 14px; margin-bottom: 5px;">
          The values in each cell represent the relative treatment effect (and 95% CI) of the treatment on the top, compared to the treatment on the left. <span class="clr-green">Green color</span> suggests relative treatment benefit. Light green suggests non-significant benefit and dark green suggests significant benefit. <span class="clr-red">Red color</span> suggests relative treatment harm. Light red suggests non-significant harm and dark red suggests significant harm.
      </div>
      <svg id="fig_lgtable" 
        style="transform: translate(-10px, -10px);">
      </svg>
    </div>
  </div>


  <div class="box-row">

    <div class="box"
      style="width: 350px;">
      <div class="box-header">
        <i class="fas fa-network-wired"></i>
        Network Plot <span id="nma-netplt"></span>
      </div>
      <div class="box-body">
        <div id="fig_netplt_box"
          style="height: 340px; width: 340px; line-height: 14px; margin-bottom: 5px;">
          <svg id="fig_netplt_box_svg"></svg>
        </div>
      </div>
    </div>

    

    <div class="box">
      <div class="box-header">
        <i class="fas fa-tree"></i>
        Forest Plot <span id="nma-fstplt"></span>
      </div>
      <div class="box-body">
        <div id="fig_fstplt"
          style="width: 435px; line-height: 14px; margin-bottom: 5px;">
          <svg id="fig_fstplt_svg"></svg>
        </div>
      </div>
    </div>

  </div>


</div>
</template>

<style scoped>
#input_panel {
  width: 300px;
  padding: 10px;
  height: 100%;

  background-color: whitesmoke;
  border-right: 1px solid #EAEAEA;

  display: flex;
  align-items: flex-start;
  flex-direction: column;
}
#vis_panel {
  width: calc(100% - 300px);
  height: 100%;
  display: flex;
  flex-direction: column;
  /* flex-wrap: wrap; */
  overflow-y: auto;
  overflow-x: hidden;
}
.box-row {
  display: flex;
  flex-direction: row;
}
.box {
  width: auto;
  padding: 5px;
  margin: 10px;
  width: 100%;
}
.box-header {
  padding: 5px 0;
}

</style>
