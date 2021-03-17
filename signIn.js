const axios = require('axios')

const url = 'https://www.dowebok.com/wp-admin/admin-ajax.php'

axios({
  url,
  method: 'post',
  headers: {
    cookie:
      'wordpress_780a8f34ab9b2593dbca7a2fc3573957=wx8d79dda9dd%7C1615773621%7CYBPk4uMCipeUwfrug3lPHDF2VfA1NnC2nu111mNu1Gr%7Cec71ba5873822c52f42de7351444939c6a9fa44647423013247f4df4d252fef0; wordpress_logged_in_780a8f34ab9b2593dbca7a2fc3573957=wx8d79dda9dd%7C1615773621%7CYBPk4uMCipeUwfrug3lPHDF2VfA1NnC2nu111mNu1Gr%7Cb8eefd8fb2df21054d4be7ec7450b4c03a7a16ad472515d7ee9366873f8411ec',
    origin: 'https://www.dowebok.com',
    referer: 'https://www.dowebok.com/',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
  },
  data: {
    action: 'checkin'
  },
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  transformRequest: [
    function (data) {
      let ret = ''
      for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
      }
      ret = ret.substring(0, ret.lastIndexOf('&'))
      return ret
    }
  ]
})
  .then(res => {
    console.log(res.data)
  })
  .catch(err => {
    console.log(err)
  })
