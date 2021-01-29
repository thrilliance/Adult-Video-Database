const {app} = require('electron').remote
const fs = require("fs")
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbPerformers = path.join(app.getPath('userData'), 'userfiles/databases/dbp.json')
const adapterPerformers = new FileSync(pathToDbPerformers)
const low = require('lowdb')
const dbp = low(adapterPerformers)
dbp.defaults({ 
  performers: [{
    id: "1111111111111111",
    name: "Angela White",
    date: Date.now(),
    edit: Date.now(),
    aliases: [
      "Angela Gabrielle White",
      "Angie"
    ],
    tags: [],
    favorite: true,
    rating: 5,
    nation: "Australia",
    birthday: "1985-03-04",
    start: "2003",
    end: "",
    ethnicity: [
      "Caucasian"
    ],
    hair: [
      "Brown"
    ],
    eyes: [
      "Blue"
    ],
    height: "160",
    weight: "55",
    boobs: "Real",
    cup: ["G"],
    bookmark: false,
    category: [
      "Pornstar"
    ],
    bra: "42",
    waist: "27",
    hip: "41",
    body: [
      "Chubby"
    ],
    pussy: "Universal",
    pussyLips: "Medium",
    pussyHair: [
      "Bald"
    ],
  }]
}).write()

const defaultFilters = {
  favorite: false,
  bookmark: false,
  firstChar: [],
  tags: [],
  tagsLogic: false,
  name: '',
  aliases: false,
  category: [],
  categoryLogic: false,
  ratingActive: false,
  rating: [0, 5],
  ageActive: false,
  age: [18, 99],
  careerActive: false,
  career: [1980, new Date().getFullYear()],
  careerEnded: false,
  heightActive: false,
  height: [100, 220],
  weightActive: false,
  weight: [20, 220],
  braActive: false,
  bra: [20, 60],
  waistActive: false,
  waist: [20, 60],
  hipActive: false,
  hip: [20, 60],
  nation: [],
  ethnicity: [],
  ethnicityLogic: false,
  hair: [],
  hairLogic: false,
  eyes: [],
  eyesLogic: false,
  cup: [],
  boobs: [],
  body: [],
  bodyLogic: false,
  pussy: [],
  pussyLips: [],
  pussyHair: [],
  pussyHairLogic: false,
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
}

const Performers = {
  state: () => ({
    bottomSheet: true,
    pageCurrent: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    showMoreFilters: false,
    defaultFilters: _.cloneDeep(defaultFilters),
    filters: _.cloneDeep(defaultFilters),
    filtersReserved: _.cloneDeep(defaultFilters),
    filteredPerformers: [],
    filteredEmpty: false,
    selection: null,
    selectedPerformers: [],
    dialogFilterPerformers: false,
    dialogDeletePerformer: false,
    dialogEditPerformerInfo: false,
    dialogEditPerformerImages: false,
    updateImages: {},
    updateInfo: {},
    rating: 0,
    menuCard: false,
    firstChar: [],
    sortBy: 'name',
    sortDirection: 'asc',
    showFavorites: false,
    showBookmarks: false,
  }),
  mutations: {
    updatePerformers (state) {
      console.log(':::::::performers UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    changePerformersPageTotal(state, quantity) {
      state.pageTotal = quantity
    },
    changePerformersPageCurrent(state, quantity) {
      state.pageCurrent = quantity
    },
    updateFiltersOfPerformers(state, {key, value}) {
      state.filters[key] = value
      // console.log(state.filters)
    },
    filterPerformers(state, filteredPerformers) {
      state.filteredPerformers = filteredPerformers
    },
    resetFilteredPerformers(state) {
      state.filters = _.cloneDeep(defaultFilters)
    },
    updateSelectedPerformers(state, ids) {
      state.selectedPerformers = ids
    },
  },
  actions: {
    changePerformersPerPage({ state, commit, getters, dispatch}, number) {
      // commit('updatePerformers')
      commit('resetLoading')
      dispatch('updateSettingsState', {key:'performersPerPage', value:number})
    },
    changePerformersPageTotal({ state, commit}, quantity) {
      // commit('updatePerformers')
      commit('changePerformersPageTotal', quantity)
    },
    changePerformersPageCurrent({ state, commit}, quantity) {
      // commit('updatePerformers')
      commit('resetLoading')
      commit('changePerformersPageCurrent', quantity)
    },
    async filterPerformers({ state, commit, getters, rootState}, stayOnCurrentPage) {
      let performers = getters.performers
      performers = performers.orderBy(p=>(p.name.toLowerCase()), ['asc'])

      if (state.showFavorites) {
        performers = performers.filter(performer=>performer.favorite)
      }
      if (state.showBookmarks) {
        performers = performers.filter(performer=>performer.bookmark)
      }
      if (state.firstChar.length) {
        let chars = ['0123456789','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!$@^&*\'+-_~']
        let allChars = []
        state.firstChar.forEach( char => { allChars.push(chars[char]) } )
        if (allChars.length) {
          performers = performers.filter( performer => {
            let charPerformer = performer.name.charAt(0).toLowerCase()
            return allChars.includes(charPerformer)
          })
        }
      }

      function compare(sign, a, b) {
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      for (let filter in rootState.Settings.performerFilters) {
        let param = rootState.Settings.performerFilters[filter].param
        let cond = rootState.Settings.performerFilters[filter].cond
        let val = rootState.Settings.performerFilters[filter].val
        let type = rootState.Settings.performerFilters[filter].type
        
        if (val === null || val.length === 0) continue
        
        if (type === 'number' || type === 'date') {
          if (type === 'number') val = +val
          if (param === 'date' || param === 'edit') val = new Date(val).getTime()
          performers = performers.filter(performer => compare(cond, val, performer[param]))
        }
        
        if (type === 'string') {
          let string = val.toLowerCase().trim()
          if (string.length) {
            if (cond === 'includes') {
              performers = performers.filter(performer => performer[param].toLowerCase().includes(string))
            } else performers = performers.filter(v => !v[param].toLowerCase().includes(string))
          }
        }

        if (type === 'array') {
          if (cond === 'all') {
            performers = performers.filter({[param]: val})
          } else if (cond === 'one of') {
            performers = performers.filter(performer=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( performer[param].includes(val[i]) ) include = true
              }
              return include
            })
          } else if (cond === 'not') {
            performers = performers.filter(performer=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( performer[param].includes(val[i]) ) include = true
              }
              return !include
            })
          }
        }

        if (type === 'select') {
          if (cond === 'includes') {
            performers = performers.filter(performer=>val.includes(performer[param]))
          } else performers = performers.filter(performer=>!val.includes(performer[param]))
        }
      }
  
      // sort performers
      if (state.sortBy === 'name') {
        performers = performers.orderBy(performer=>performer.name.toLowerCase(), [state.sortDirection])
      } else {
        performers = performers.orderBy(state.sortBy, [state.sortDirection])
      }
      // if (state.filters.boobs.length) {
      //   if (state.filters.boobs.includes('None')) {
      //     performers = performers.filter(p=>(p.boobs === ''))
      //   } else {
      //     performers = performers.filter(p=>(state.filters.boobs.includes(p.boobs.charAt(0).toUpperCase()+p.boobs.slice(1))))
      //   }
      //   // console.log('performers filtered by boobs')
      // }
      // if (state.filters.name) {
      //   let frase = state.filters.name.toLowerCase().trim()
      //   if (frase.length) {
      //     if (state.filters.aliases === true) {
      //       let filteredByNames = await performers.filter(
      //         perf => (perf.name.toLowerCase().includes(frase))
      //       ).map('id').value()

      //       let filteredByAliases = await performers.filter( perf => {
      //         let aliases = perf.aliases.map(p=>(p.toLowerCase()))
      //         let matches = aliases.filter(a=>a.includes(frase))
      //         if (matches.length>0) {
      //           return true
      //         } else { return false } 
      //       }).map('id').value()

      //       let mergedIds = _.union(filteredByNames, filteredByAliases)

      //       performers = performers.filter(p=>(mergedIds.includes(p.id)))
      //     } else {
      //       performers = performers.filter(
      //         perf => (perf.name.toLowerCase().includes(frase)))
      //     }
      //     // console.log(`performers filtered by frase "${frase}" in name`)
      //   }
      // }
      // // console.log(performers.value())
      let filteredPerformers = []
      if (performers != getters.performers) {
        if (performers.value().length == 0) {
          state.filteredEmpty = true
          filteredPerformers = performers
        } else {
          state.filteredEmpty = false
          filteredPerformers = performers
        }
      }
      // console.log(filteredPerformers)
      commit('resetLoading')
      commit('filterPerformers', filteredPerformers)
      if (!stayOnCurrentPage) {
        state.filters.page = 1
        commit('changePerformersPageCurrent', 1)
      }
    },
    deletePerformers({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedPerformers.map(id => {
        let performerName = getters.performers.find({id:id}).value().name
        // remove performer from videos
        getters.videos.each(video=>{
          let index = video.performers.indexOf(performerName)
          if (index !== -1) video.performers.splice(index, 1)
        }).write()
        // remove perfromer from database
        getters.performers.remove({ 'id': id }).write()
        // remove images of perfromer
        let imageTypes = ['main','alt','custom1','custom2','avatar','header']
        imageTypes.map(img=>{
          let imgPath = path.join(getters.getPathToUserData, `/media/performers/${id}_${img}.jpg`)
          fs.unlink(imgPath, (err) => {
            if (err) {
              console.log("failed to delete local image:"+err)
            } else {
              console.log('successfully deleted local image')
            }
          })
        })
      })
      commit('updateSelectedPerformers', [])
      commit('updatePerformers')
      dispatch('filterPerformers', true)
    },
  },
  getters: {
    dbp(state) {
      return state.lastChanged, dbp
    },
    performers(state, store) {
      return store.dbp.get('performers')
    },
    performersNames(state, store) {
      return store.dbp.get('performers').map('name').value()
    },
    performersNamesLower(state, store) {
      return store.dbp.get('performers').map(p=>p.name.toLowerCase()).value()
    },
    performerFiltersForTabName: (state, store, rootState) => {
      let filters = []
      let equals = ['equal', 'including', 'all', 'one of']
      let notEquals = ['not equal', 'not', 'excluding']
      
      for (let filter in rootState.Settings.performerFilters) {
        let param = rootState.Settings.performerFilters[filter].param
        let cond = rootState.Settings.performerFilters[filter].cond
        let val = rootState.Settings.performerFilters[filter].val
        let type = rootState.Settings.performerFilters[filter].type

        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array') {
          let arr = param+' '+cond+' '
          arr += val.join(';')
          filters.push(arr)
        } else {
          filters.push(param+' '+cond+' '+val)
        }
      }
      return 'Performers' + (filters.length ? ' with ': ' ') + filters.join(', ')
    },
    filteredPerformers(state, store) {
      // console.log(state.filteredPerformers.length)
      // console.log(state.filteredPerformers)
      let performers 
      if (state.filteredPerformers.length===0) {
        performers = store.performers
        console.log('get performers from db')
      }
      if (state.filteredPerformers.length!==0) {
        performers = state.filteredPerformers
        console.log('get filtered performers')
      }
      return performers
    },
    filteredPerformersTotal(state, store) {
      if (state.filteredPerformers.length==0) {
        // console.log(state.filteredPerformers.length)
        return state.filteredPerformers.length
      } else {
        // console.log(state.filteredPerformers.value().length)
        return state.filteredPerformers.value().length
      }
    },
    performersDataBase(state, store) {
      return store.dbp
    },
    performersTotal: (state, store) => {
      return store.performers.value().length;
    },
    performersOnPage(state, store, rootState) {
      const performers = store.filteredPerformers.value(),
            performersCount = rootState.Settings.performersPerPage
      // console.log(performers)
      let l = performers.length,
          c = performersCount;
      state.pageTotal = Math.ceil(l/c);
       // console.log(state.pageTotal)
      if(state.filters.page) {
        state.pageCurrent = state.filters.page
      }
      if(state.pageCurrent > state.pageTotal) {
        state.pageCurrent = state.pageTotal
      }
      
      const end = state.pageCurrent * performersCount,
            start = end - performersCount;
      return performers.slice(start, end)
    },
    performersPagesSum(state) {
      return state.pageTotal
    },
    performersPages(state, store) {
      let pages = []
      for (let i = 0; i < store.performersPagesSum; i++) {
        pages.push(i+1)
      }
      return pages
    },
    performersCurrentPage(state) {
      return state.pageCurrent
    },
    getSelectedPerformers(state) {
      return state.selectedPerformers
    },
  }
};

export default Performers