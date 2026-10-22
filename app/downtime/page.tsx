"use client";
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export default function Downtime(){const router=useRouter();useEffect(()=>router.replace('/dashboard?module=oee'),[router]);return <p className="loading-screen">Opening the production stop-loss register…</p>;}
