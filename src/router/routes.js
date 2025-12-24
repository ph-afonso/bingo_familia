const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/PlayerBingo.vue') }, // Jogadores acessam a home
      { path: 'admin', component: () => import('pages/AdminBingo.vue') } // Você acessa /admin
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
