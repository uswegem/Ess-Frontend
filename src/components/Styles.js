import { Paper, Typography, styled } from "@mui/material";

export const BackPaper = styled(Paper)({
    height: "auto",
    borderRadius: "0",
    padding: "20px !important",
    overflowX: 'hidden',
    // overflowY: 'auto',
    boxShadow: "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px"
})

export const LoginPaper = styled(Paper)({
    height: "500px",
    border: "1px solid rgba(114, 114, 114, 0.3)",
    width: "100%",
    backgroundColor: "#fff",
    padding: "15px",
    // overflow: "auto",
    borderRadius:"12px",
    boxShadow: "none"
})

export const InnerPaper = styled(Paper)({
    height: "auto",
    
    border: "1px solid rgba(114, 114, 114, 0.3)",
    width: "100%",
    backgroundColor: "#fff",
    padding: "12px",
    overflow: "auto",
    borderRadius:"10px",
    boxShadow: "none"
})



export const NavPaper = styled(Paper)({
    padding: "7px",
    borderRadius: "0",
    backgroundColor: "white",
    boxShadow: "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px"
})


export const DetailLabel = styled(Typography)({
    fontSize: "14px",
    color: "#000814",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: "8px",
    fontFamily: 'system-ui',
    fontWeight: "bold"
})

export const LabelBooking = styled(Typography)({
    fontSize: "25px",
    color: "#000000",
    textTransform: 'capitalize',
    fontWeight: "500",
    fontFamily: 'system-ui',
})

export const TimePrice = styled(Typography)({
    fontSize: "16px",
    color: "#000000",
    textTransform: 'capitalize',
    fontWeight: "500",
    fontFamily: 'system-ui',
})



export const DetailData = styled(Typography)({
    fontSize: "15px",
    color: "#000000",
    fontWeight: "500",
    fontFamily: 'system-ui',
})


export const DetailText = styled(Typography)({
    fontSize: "14px",
    color: "#515050",
    display: "flex",
    paddingLeft: "20px",
    fontFamily: 'system-ui',
    marginBottom: "18px",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: "8px",
    fontWeight: "400"
})

export const BookingText = styled(Typography)({
    fontSize: "15px",
    color: "#515050",
    display: "flex",
    fontFamily: 'system-ui',
    marginBottom: "18px",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: "8px",
    fontWeight: "500"
})

export const BusinessName = styled(Typography)({
    fontSize: "18px",
    color: "#000814",
    display: "flex",
    justifyContent: "flex-start",
    fontFamily: 'system-ui',
    alignItems: "center",
    gap: "8px",
    fontWeight: "bold"
})

export const BusinessLink = styled(Typography)({
    fontSize: "13px",
    color: "#0466c8",
    display: "flex",
    justifyContent: "flex-start",
    fontFamily: 'system-ui',
    alignItems: "center",
    gap: "8px",
    fontWeight: "bold"
})

export const BusinessLikesFoll = styled(Typography)({
    fontSize: "12px",
    color: "#495057",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    fontFamily: 'system-ui',
    gap: "8px",
    fontWeight: "bold"
})


export const FilterIconDown = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-sort-down" viewBox="0 0 16 16">
            <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z" />
        </svg>
    )
}

export const FilterIconUp = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16">
            <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.5.5 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z" />
        </svg>
    )
}