// Client side
const socket = io()

//Elements
const form = document.querySelector("#messageForm");
const formInput = form.querySelector('input')
const formBtn = form.querySelector('button')
const locationBtn = document.querySelector("#sendLocation");
const messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#messageTemplate").innerHTML
const locationMessageTemplate = document.querySelector("#locationMessageTemplate").innerHTML
const sideBarTemplate = document.querySelector("#sideBarTemplate").innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoScroll = () => {
  const newMessage = messages.lastElementChild
  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = messages.offsetHeight
  const containerHeight = messages.scrollHeight
  const scrollOffset = messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight
  }
}

socket.on('message', (message)=>{
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on("roomData", ({room, users}) => {
  const html = Mustache.render(sideBarTemplate, {
    room: room,
    users: users,
  });
  document.querySelector("#sidebar").innerHTML = html
})

form.addEventListener('submit', (e) => {
  e.preventDefault()

  formBtn.setAttribute('disabled', 'disabled')

  const message = e.target.elements.message.value

  socket.emit('sendMessage', message, (error) =>{
    formBtn.removeAttribute("disabled");
    formInput.value = ""
    formInput.focus()
    if(error){
      return console.log(error)
    }
    console.log("Message provided")
  })
})

locationBtn.addEventListener('click', (e) => {
   if(!navigator.geolocation) {
    return alert('Geolocation is not supported in your browser')
   }

   locationBtn.setAttribute('disabled', 'disabled')

   navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }, () => {
      locationBtn.removeAttribute('disabled')
      console.log("Location shared")
    })
   })
})

socket.emit('join', {username, room}, (error) => {
  if(error){
    alert(error)
    location.href = '/'
  }
})