import './app.css'
import SalesApp from './SalesApp.svelte'
import { mount } from 'svelte'

const app = mount(SalesApp, {
  target: document.getElementById('sales-app')!,
})

export default app
