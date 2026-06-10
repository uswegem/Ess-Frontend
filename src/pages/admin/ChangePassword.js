import React, { useState } from 'react'
import { BackPaper, DetailData } from '../../components/Styles'
import { Grid } from '@mui/material'
import { postRequest } from '../../ApiFunction'
import API from '../../Api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'


const ChangePassword = () => {
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const [obj, setObj] = useState({
    new_password: "",
    old_password: "",
    confirm_password: ""
  });

  const handleKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };

  const inputEvent = (e) => {
    setObj({
      ...obj,
      [e.target.name]: e.target.value,
    })
  };


  const submitForm = async (event) => {
    event.preventDefault();
    try {
      if (obj.new_password.length < 6) {
        setMessage('New password must be 6 character or long!.')
      } else if (obj.new_password !== obj.confirm_password) {
        setMessage('New Password not matched!.')
      } else {
        const result = await postRequest(`${API.CHANGE_PASSWORD}`, obj);
        if (!result.data.status) {
          if (result.data.code === 205) {
            toast.error(result.data.message)
          } else if (result.data.code === 201) {
            toast.error(result.data.message)
          } else if (result.data.code === 203) {
            toast.error(result.data.message)
            navigate('/')
            localStorage.clear()
          } else {
            toast.error(result.data.message)
          }
          setMessage(result.data.message)
        } else {
          toast.success(result.data.message)
          setMessage('')
          setObj({
            new_password: "",
            old_password: "",
            confirm_password: ""
          })
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  };


  return (
    <BackPaper>
      <form onSubmit={submitForm}>
        <Grid container direction="column" justifyContent="center" alignItems="flex-start">
          <Grid item><div className='text-Change'>Change Password</div></Grid>
          <Grid item>Please ensure you enter correct old password.</Grid>
          <Grid item><DetailData className='mt-4'>Old Password</DetailData></Grid>
          <Grid item style={{ width: "40%" }}>
            <input required={true} type="password" id="password" name="old_password" onChange={inputEvent} onKeyDown={handleKeyDown} className='detailBarInput' value={obj.old_password} />
          </Grid>
          <Grid item>Your password must be at least six characters and cannot contain spaces or match your email address.</Grid>
          <Grid item><DetailData className='mt-4'>New Password</DetailData></Grid>
          <Grid item style={{ width: "40%" }}><input required={true} type="password" id="new_password" name="new_password" onChange={inputEvent} onKeyDown={handleKeyDown} className='detailBarInput' value={obj.new_password} />  </Grid>
          <Grid item><DetailData className='mt-4'>Confirm New Password</DetailData></Grid>
          <Grid item style={{ width: "40%" }}><input required={true} type="password" id="confirm_password" name="confirm_password" onChange={inputEvent} onKeyDown={handleKeyDown} className='detailBarInput' value={obj.confirm_password} />  </Grid>
          <Grid item>{message !== "" ? <div className='errText'>{message}</div> : null}</Grid>
          <Grid item><button className='custom-button mt-2' >Set Password</button></Grid>
        </Grid>
      </form>
    </BackPaper>
  )
}

export default ChangePassword
