import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const API_BASE = process.env.API_BASE || 'http://localhost:8080'
console.log(API_BASE)

const menteeToken =
  process.env.MENTEE_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiZDZlNmY4YjItZmI2ZC00MGNhLThlYWUtYWJmMzczMGY0YWM4IiwidXNlcm5hbWUiOiJNZW50ZWUgMTQiLCJlbWFpbCI6Im1lbnRlZTE0QGdtYWlsLmNvbSIsInJvbGUiOiJtZW50ZWUiLCJyb2xlSWQiOiI4NDgzNWRlNS01MDRmLTRhMTUtYWVlMy00ZjM0YTkxZGEyMTkifSwic2tpbGxzIjpbXSwic2hvcnRCaW8iOm51bGwsImdvYWxzIjpudWxsLCJpbmR1c3RyeSI6bnVsbCwiZXhwZXJpZW5jZSI6bnVsbCwiYXZhaWxhYmlsaXR5IjpudWxsLCJpYXQiOjE3NzE3MjExOTcsImV4cCI6MTc3MjU4NTE5N30.udYCOaVtCIMWK_MAipshS5s0vnj1wJJFJ6s7VYYETeE'
const mentorToken =
  process.env.MENTOR_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjhlODc1MDUtOTExMS00MzkzLWIwMmQtYmY1MzI2OTY0YTBkIiwidXNlcm5hbWUiOiJNZW50b3IgMTMiLCJlbWFpbCI6Im1lbnRvcjEzQGdtYWlsLmNvbSIsInJvbGUiOiJtZW50b3IiLCJyb2xlSWQiOiJiY2M1MzU4Yi04MDE5LTRjZjAtYWI4Ny0xMjA3ZmMzMTNiZjIifSwic2tpbGxzIjpbXSwic2hvcnRCaW8iOm51bGwsImdvYWxzIjpudWxsLCJpbmR1c3RyeSI6bnVsbCwiZXhwZXJpZW5jZSI6bnVsbCwiYXZhaWxhYmlsaXR5IjpudWxsLCJpYXQiOjE3NzE3MjExNTMsImV4cCI6MTc3MjU4NTE1M30.VdqjXCdKy6eV2xdbeoazonDrtMBe_znqZFPWMRd1xU0'
const mentorId = process.env.MENTOR_ID || 'ae4fd698-f173-40b2-b1be-b3f4b8a32a52'

console.log(menteeToken, mentorToken, mentorId)
const axiosMentee = axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${menteeToken}` }
})

const axiosMentor = axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${mentorToken}` }
})

async function createMentorshipRequest () {
  try {
    const res = await axiosMentee.post('/mentorship/mentorship-requests', {
      mentorId
    })
    console.log('✅ Request created:', res.data)
    return res.data
  } catch (err: any) {
    console.error(
      '❌ Failed to create request:',
      err.response?.data || err.message
    )
  }
}

async function listIncomingRequests () {
  try {
    const res = await axiosMentor.get(
      '/mentorship/mentorship-requests/incoming'
    )
    console.log('✅ Incoming requests:', res.data)
    return res.data
  } catch (err: any) {
    console.error(
      '❌ Failed to list incoming requests:',
      err.response?.data || err.message
    )
  }
}

async function respondToRequest (id: string, status: 'accepted' | 'rejected') {
  try {
    const res = await axiosMentor.patch(
      `/mentorship/mentorship-requests/${id}`,
      {
        status
      }
    )
    console.log(`✅ Request ${status}:`, res.data)
    return res.data
  } catch (err: any) {
    console.error(
      '❌ Failed to respond to request:',
      err.response?.data || err.message
    )
  }
}

async function getMenteeRequests () {
  try {
    const res = await axiosMentee.get('/mentorship/mentorship-requests/sent')
    console.log('✅ Mentee requests:', res.data)
    return res.data
  } catch (err: any) {
    console.error(
      '❌ Failed to get mentee requests:',
      err.response?.data || err.message
    )
  }
}

// Automated test flow
async function testMentorshipRequestsFlow () {
  console.log('--- Starting Mentorship Request API Tests ---')

  // 1️⃣ Create request
  // const requestData = await createMentorshipRequest()
  // if (!requestData) return

  // 2️⃣ List mentor incoming requests
  const incoming = await listIncomingRequests()
  // if (!incoming || incoming.data.length === 0) {
  //   return
  // }

  const requestId = incoming.data[0].id

  // 3️⃣ Mentor responds to request (accept)
  await respondToRequest(requestId, 'accepted')

  // 4️⃣ Mentee checks request status
  await getMenteeRequests()

  console.log('--- Mentorship Request API Tests Completed ---')
}

// Run the automated test
testMentorshipRequestsFlow()
