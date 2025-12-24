<template>
  <q-page padding class="flex flex-center column bg-grey-2">
    
    <div v-if="!playerId" class="q-pa-lg bg-white shadow-3 rounded-borders text-center" style="width: 300px">
      <div class="text-h4 q-mb-md text-primary">Bingo!</div>
      <q-input v-model="playerName" label="Seu Nome" outlined dense class="q-mb-md" />
      <q-btn color="primary" label="Entrar" class="full-width" @click="joinGame" :disable="!playerName" push size="lg" />
    </div>

    <div v-else-if="hasWon" class="flex flex-center column text-center q-pa-md">
      <q-icon name="emoji_events" color="warning" size="100px" class="q-mb-md animate-bounce" />
      <div class="text-h3 text-weight-bold text-primary">BINGO!</div>
      <div class="text-h6 text-grey-8 q-mt-sm">Parabéns, {{ playerName }}!</div>
      <p class="q-mt-md">Você completou a cartela. Aguarde o admin verificar.</p>
      <q-btn label="Sair da Sala" flat color="grey" @click="leaveGame" />
    </div>

    <div v-else class="flex flex-center column full-width">
      
      <div class="row items-center justify-between full-width q-px-md q-mb-sm" style="max-width: 400px">
        <div class="text-subtitle1"><b>{{ playerName }}</b></div>
        <div class="text-caption text-grey">Acertos: {{ matchesCount }}</div>
      </div>

      <div v-if="lastNumber" class="q-pa-sm q-mb-md bg-white shadow-2 rounded-borders text-center animate-pop" style="min-width: 100px">
        <div class="text-caption text-grey">Sorteado</div>
        <div class="text-h3 text-primary text-weight-bolder">{{ lastNumber }}</div>
      </div>

      <div class="bingo-card shadow-5 bg-white">
        <div class="row bg-primary text-white text-h6 text-bold text-center">
          <div class="col" v-for="letter in ['B', 'I', 'N', 'G', 'O']" :key="letter">{{ letter }}</div>
        </div>
        <div v-for="rowIdx in 5" :key="rowIdx" class="row text-center">
          <div v-for="colKey in ['B', 'I', 'N', 'G', 'O']" :key="colKey" class="col bingo-cell">
            <q-btn
              round flat class="full-width full-height text-h6"
              :color="isMarked(getVal(colKey, rowIdx)) ? 'negative' : 'black'"
              :class="{'bg-red-1': isMarked(getVal(colKey, rowIdx))}"
              :label="getVal(colKey, rowIdx)"
              :disable="getVal(colKey, rowIdx) === 'FREE'"
            />
          </div>
        </div>
      </div>

      <div class="q-mt-md q-gutter-sm">
        <q-chip v-if="myPatterns.includes('horizontal')" icon="check" color="blue" text-color="white" label="Linha Feita" />
        <q-chip v-if="myPatterns.includes('diagonal')" icon="check" color="orange" text-color="white" label="Diagonal Feita" />
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { generateCard, checkPatterns } from 'src/utils/bingoLogic'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'
import confetti from 'canvas-confetti'

const $q = useQuasar()
const playerName = ref('')
const playerId = ref(null)
const myCard = ref(generateCard())
const serverDrawnNumbers = ref([])
const lastNumber = ref(null)
const hasWon = ref(false)
const myPatterns = ref([])

// Helpers
const getVal = (col, rowIdx) => myCard.value[col][rowIdx - 1]
const isMarked = (val) => val === 'FREE' || serverDrawnNumbers.value.includes(val)

const matchesCount = computed(() => {
  let count = 0;
  ['B','I','N','G','O'].forEach(c => myCard.value[c].forEach(n => {
    if(n === 'FREE' || serverDrawnNumbers.value.includes(n)) count++
  }))
  return count
})

// --- AÇÕES ---

const joinGame = async () => {
  const { data, error } = await supabase.from('players').insert({ 
    name: playerName.value, 
    card_data: myCard.value,
    status: 'playing' 
  }).select().single()
  
  if (!error && data) {
    playerId.value = data.id
    initRealtime()
  }
}

const leaveGame = () => {
  location.reload() // Reseta a aplicação para o jogador
}

const triggerWin = async () => {
  hasWon.value = true
  
  // 1. ANIMAÇÃO DE CONFETTI
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  }());

  // 2. Atualizar Banco (Marca como Vencedor)
  await supabase.from('players').update({ status: 'winner' }).eq('id', playerId.value)
}

// --- MONITORAMENTO ---

watch(serverDrawnNumbers, async (newNumbers) => {
  if (!playerId.value || hasWon.value) return;

  const currentPatterns = checkPatterns(myCard.value, newNumbers)
  myPatterns.value = currentPatterns

  // Atualiza progresso no servidor
  await supabase.from('players').update({ 
    completed_patterns: currentPatterns,
    matches_count: matchesCount.value 
  }).eq('id', playerId.value)

  // SE BINGAR (FULL)
  if (currentPatterns.includes('full')) {
    triggerWin()
  }
}, { deep: true })


const initRealtime = async () => {
  // Carrega dados iniciais
  const { data } = await supabase.from('game_state').select('*').eq('id', 1).single()
  if (data) {
    serverDrawnNumbers.value = data.drawn_numbers
    lastNumber.value = data.last_number
  }

  // Ouve atualizações
  supabase.channel('game-room')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state' }, payload => {
      serverDrawnNumbers.value = payload.new.drawn_numbers
      lastNumber.value = payload.new.last_number
    })
    .subscribe()
}
</script>

<style scoped>
.bingo-card { width: 100%; max-width: 400px; border-radius: 8px; overflow: hidden; }
.bingo-cell { aspect-ratio: 1; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; }
.animate-pop { animation: pop 0.3s ease-out; }
@keyframes pop { 0% { transform: scale(0.5); } 100% { transform: scale(1); } }
.animate-bounce { animation: bounce 2s infinite; }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-30px);} 60% {transform: translateY(-15px);} }
</style>