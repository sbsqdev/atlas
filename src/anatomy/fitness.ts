import type {Atlas} from './anatomy';
export type MuscleRole='primary'|'secondary'|'stabilizer';
export interface Exercise {id:string;name:string;courseId?:string;lessonId?:string;muscles:{conceptId:string;role:MuscleRole}[]}
/** Course authors supply FMA concept IDs, independent of mesh packing or display names. */
export function resolveExercise(atlas:Atlas,exercise:Exercise):Record<string,MuscleRole>{
 if(!exercise||typeof exercise.id!=='string'||!exercise.id.trim()||typeof exercise.name!=='string'||!exercise.name.trim()||!Array.isArray(exercise.muscles)||!exercise.muscles.length)throw new Error('Exercise requires an id, name, and muscle mappings.');
 const parts=new Map(atlas.parts.map(p=>[p.id,p]));const concepts=new Map(atlas.concepts.map(c=>[c.id,c]));const result:Record<string,MuscleRole>={};const priority={primary:3,secondary:2,stabilizer:1};
 for(const muscle of exercise.muscles){if(!muscle||!Object.hasOwn(priority,muscle.role))throw new Error('Invalid muscle role.');const concept=concepts.get(muscle.conceptId);if(!concept)throw new Error(`Unknown muscle concept: ${muscle.conceptId}`);const elements=concept.elements.filter(id=>parts.get(id)?.system==='muscular');if(!elements.length)throw new Error(`Concept is not a skeletal muscle: ${muscle.conceptId}`);for(const id of elements){if(!result[id]||priority[muscle.role]>priority[result[id]])result[id]=muscle.role;}}
 return result;
}
export function demoExercise(atlas:Atlas):Exercise{
 return {id:'push-up-example',name:'Push-up example',muscles:atlas.concepts.filter(c=>/pectoralis major|triceps brachii/i.test(c.name)&&c.elements.some(id=>atlas.parts.some(p=>p.id===id&&p.system==='muscular'))).map(c=>({conceptId:c.id,role:(/pectoralis major/i.test(c.name)?'primary':'secondary') as MuscleRole}))};
}
declare global {interface Window {humanAtlas?:{version:1;setExercise:(exercise:Exercise)=>void;clearExercise:()=>void;listMuscles:()=>{id:string;name:string}[]}}}
