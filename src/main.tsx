import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import './index.css'
import App from './App.tsx'
import Inspect from './Inspect.tsx'

const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: App,
    },
    {
      path: '/inspect',
      Component: Inspect,
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
