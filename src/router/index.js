import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/home/index.vue';

const routes = [
  { path: '/', redirect: '/home'},
  { name: 'home', path: '/home', component: Home },
  { name: 'spreadsheet', path: '/spreadsheet', component: ()=>import("../apps/spreadsheet/views/home/index.vue")},
  { name: 'mindmap', path: '/mindmap', component: ()=>import("../apps/mindmap/views/home/index.vue")},
  { name: 'todo', path: '/todo', component: ()=>import("../apps/todo/views/home/index.vue")},
  { name: 'calendar', path: '/calendar', component: ()=>import("../apps/calendar/views/home/index.vue")},
  { name: 'tapsynth', path: '/tapsynth', component: ()=>import("../apps/tapsynth/Main.vue")},
  { name: 'editor', path: '/editor', component: ()=>import("../apps/editor/Main.vue")},
  { name: 'alarm', path: '/alarm', component: ()=>import("../apps/alarm/Main.vue")},
  { name: 'composer', path: '/composer', component: ()=>import("../apps/composer/views/home/index.vue")},
  { name: 'localstorage', path: '/localstorage', component: ()=>import("../apps/localstorage/views/home/index.vue")},
  { name: 'explorer', path: '/explorer', component: ()=>import("../apps/explorer/views/home/index.vue")}
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});
/*
router.beforeEach((to, from, next) => {
  next();
});
*/

export default router;
