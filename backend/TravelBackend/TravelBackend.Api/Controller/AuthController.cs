using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.User;

namespace TravelBackend.Api.Controller
{
    [Route("api/session")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        internal IUserLoginAction _userAction;

        public AuthController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _userAction = bl.UserLoginAction();
        }

        [HttpPost("auth")]
        public IActionResult Auth([FromBody] UserLoginDto udata)
        {
            var data = _userAction.UserLoginDataValidation(udata);
            if (data.IsSuccess)
            {
                return Ok(data);
            }

            return Unauthorized(data);
        }
    }
}
