import './app.css'
import AdminApp from './AdminApp.svelte'
import { mount } from 'svelte'

const app = mount(AdminApp, {
  target: document.getElementById('admin-app')!,
})

export default app
