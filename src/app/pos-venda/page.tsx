'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

import type {
  Comercio,
  Visita,
  HistoricoItem,
  NegItem,
  NegEmpItem,
} from '@/types/crm'

import {
  CAT,
  SC,
  SA,
  PO,
  RES_LABEL,
  RES_COR,
  RES_ICON,
  PRODS_COM,
  PRODS_EMP,
  SEGMENTOS,
} from '@/types/crm'

import {
  calcularDistancia,
  formatarDistancia,
  statusVisual,
  pinCor,
  segmentoParaCategoria,
} from '@/utils/geo'

import {
  calcularTotal,
  formatarDataHora,
  dataHojeIso,
} from '@/utils/crm'

import {
  buscarComerciosAtivos,
  atualizarStatusComercio,
  atualizarPosVisita,
  buscarHistoricoComercio,
  criarNovoLead,
} from '@/services/crmService'

import {
  buscarVisitasHoje,
  registrarVisita,
} from '@/services/visitaService'
