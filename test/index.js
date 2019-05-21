import Vue from 'vue';
import App from './index.vue';

import './index.scss';
import {
    DatePicker, 
    message, 
    Alert,
} from 'antd';
import { Radio, RadioGroup, Cell, CellGroup, Icon } from "vant";

new Vue({
    el: '#js-app-container',
    template: '<App></App>',
    components: { App },
});

// document.body.innerHTML = '来一梭哈！';