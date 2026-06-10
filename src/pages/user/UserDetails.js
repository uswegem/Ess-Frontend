import { ErrorOutline, LocationOn, QueryBuilder } from '@mui/icons-material'
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/loader/Loader'
import API, { BASE_URL } from '../../Api'
import { BackPaper, InnerPaper } from '../../components/Styles'
import moment from 'moment'
import { postRequest } from '../../ApiFunction'
import toast from 'react-hot-toast'


const UserDetails = () => {
    const router = useParams()
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [address, setAddress] = useState([])
    const [obj, setObj] = useState({ name: "", email: "", role: "", mechanic_knowledge: "", general_car_knowledge: "" })
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const [selectedServices, setSelected] = useState([])
    const [history, setHistory] = useState(0)


    const getAll = useCallback(async () => {
        const result = await postRequest(`${API.GET_USER_DETAILS}`, { id: router.id });
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
        } else {
            setSelected(result.data.selected_service)
            setHistory(result.data.history_user)
            setObj(result.data.data)
            setAddress(result.data.address)
            await delay(1000);
            setIsLoading(false)
        }
    },[router,navigate])

    useEffect(() => {
        setIsLoading(true)
        getAll()
    }, [getAll])

    return (
        <>
            {isLoading ?
                <Loader />
                :
                <>
                    <div className='topNavigator'>
                        <h4>User Details</h4>
                        <p>{router.id}</p>
                    </div>
                    <BackPaper >
                        <div className='row service-style'>
                            <div className='col-xs-12 col-sm-12 col-md-8 col-lg-8 mb-4'>
                                <InnerPaper>
                                    <div className='heading'>User Information</div>
                                    <div className='d-flex justify-content-start align-items-center gap-3 mt-2'>
                                        {obj.profile_pic !== '' ? (
                                            <>
                                                <img src={`${BASE_URL}uploads/images/${obj.profile_pic}`} alt="user" className='user-detailsImage' />
                                            </>
                                        ) : (
                                            <img src="/images/blank_pic.png" className='user-detailsImage' alt="" />

                                        )}
                                        <div className='d-flex flex-column justify-content-start gap-1 mb-3'>
                                            <div className='para'>{obj.name}</div>
                                            <div className='desc'>{obj.email}</div>
                                            <div className='type w-0 mt-1'>{obj.isBlocked ? 'Blocked' : 'Active'}</div>
                                        </div>
                                    </div>
                                    <div className='para mt-4'>Addresses:</div>
                                    <div className='desc'>
                                        <div className='d-flex gap-2 flex-wrap flex-column'>
                                            {address.map((element, index) => (
                                                <div className='d-flex gap-2 justify-content-start align-items-start user-address'>
                                                    <div key={index + 1}><LocationOn className='icon' /></div>
                                                    <div>{element.address}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </InnerPaper>
                            </div>
                            <div className='col-xs-12 col-sm-12 col-md-4 col-lg-4 mb-4'>
                                <InnerPaper className='h-100'>
                                    <div className='heading'>Booked history</div>
                                    <div className='d-flex flex-column justify-content-start mt-4'>
                                        <div className='number'>{history}</div>
                                        <div className='small'>Total booked services</div>
                                    </div>
                                </InnerPaper>
                            </div>
                            <div className='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
                                <InnerPaper className='h-100'>
                                    <div className='heading'>Pending or Expired Services</div>
                                    {selectedServices && selectedServices.length === 0 ?
                                        <div className='mt-4 empty-service'>
                                            <ErrorOutline className="icon" />
                                            <p>This user does not have any pending service yet.</p>
                                        </div>
                                        :
                                        <div className='d-flex flex-column justify-content-start align-items-start mt-4 w-100'>
                                            {selectedServices && selectedServices.map((element, index) => (
                                                <>
                                                    {!element.isAccepted && !element.isCompleted && !element.isExpired && !element.isRejected ?
                                                        <div className='mt-4 empty-service pending w-100 justify-content-start flex-row'>
                                                            <div className='d-flex justify-content-start align-items-center gap-3 mt-2'>
                                                                <QueryBuilder className='icon warning' />
                                                                <div className='d-flex flex-column justify-content-start gap-1'>
                                                                    <div className='para'>Services: {element.selected_service.length} </div>
                                                                    <div className='desc'>Pending Approval</div>
                                                                    <div className='desc w-0 mt-1'>{moment(element.appointment_date).format('LL')} at {element.time}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        : !element.isAccepted && !element.isCompleted && element.isExpired && !element.isRejected ?
                                                            <div className='mt-4 empty-service w-100 expire justify-content-start flex-row'>
                                                                <div className='d-flex justify-content-start align-items-center gap-3 mt-2'>
                                                                    <ErrorOutline className='icon red' />
                                                                    <div className='d-flex flex-column justify-content-start gap-1'>
                                                                        <div className='para'>Services: {element.selected_service.length} </div>
                                                                        <div className='desc'>Expired</div>
                                                                        <div className='desc w-0 mt-1'>{moment(element.appointment_date).format('LL')} at {element.time}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            : null}
                                                </>
                                            ))}
                                        </div>
                                    }
                                </InnerPaper>
                            </div>
                        </div>
                    </BackPaper>
                </>}

        </>
    )
}

export default UserDetails


