17:40:26.205 Running build in Washington, D.C., USA (East) – iad1
17:40:26.206 Build machine configuration: 2 cores, 8 GB
17:40:26.455 Cloning github.com/RonnyVegas2025/crm-vegas (Branch: main, Commit: aaa72be)
17:40:26.942 Cloning completed: 486.000ms
17:40:27.504 Restored build cache from previous deployment (Ac1jvpqMycFHfCpj6eYZ1p28k5ph)
17:40:28.136 Running "vercel build"
17:40:28.897 Vercel CLI 50.38.1
17:40:29.107 Installing dependencies...
17:40:31.785 
17:40:31.786 up to date in 2s
17:40:31.786 
17:40:31.786 24 packages are looking for funding
17:40:31.787   run `npm fund` for details
17:40:31.821 Detected Next.js version: 14.2.5
17:40:31.824 Running "npm run build"
17:40:31.928 
17:40:31.929 > vegas-posvendas@0.1.0 build
17:40:31.930 > next build
17:40:31.930 
17:40:32.607   ▲ Next.js 14.2.5
17:40:32.608 
17:40:32.625    Creating an optimized production build ...
17:40:39.114  ✓ Compiled successfully
17:40:39.116    Linting and checking validity of types ...
17:40:42.782 Failed to compile.
17:40:42.783 
17:40:42.783 ./src/components/crm/ModalDetalheComercio.tsx:140:21
17:40:42.784 Type error: 'comercio' is possibly 'null'.
17:40:42.784 
17:40:42.784 [0m [90m 138 |[39m[0m
17:40:42.784 [0m [90m 139 |[39m       [36mawait[39m onSalvarNegociacao({[0m
17:40:42.784 [0m[31m[1m>[22m[39m[90m 140 |[39m         comercioId[33m:[39m comercio[33m.[39mid[33m,[39m[0m
17:40:42.785 [0m [90m     |[39m                     [31m[1m^[22m[39m[0m
17:40:42.785 [0m [90m 141 |[39m         status_crm[33m:[39m produtosSelecionados[33m.[39mlength [33m>[39m [35m0[39m [33m?[39m [32m'em_negociacao'[39m [33m:[39m comercio[33m.[39mstatus_crm [33m||[39m [32m'ativo'[39m[33m,[39m[0m
17:40:42.785 [0m [90m 142 |[39m         data_proximo_contato[33m:[39m proximoContato [33m||[39m [36mnull[39m[33m,[39m[0m
17:40:42.785 [0m [90m 143 |[39m         produtos_negociando[33m:[39m produtosSelecionados[33m,[39m[0m
17:40:42.833 Error: Command "npm run build" exited with 1
